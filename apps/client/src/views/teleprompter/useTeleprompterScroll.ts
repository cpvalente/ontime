import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  advance,
  anchorAtReadPoint,
  type BlockGeometry,
  clamp,
  clampSpeed,
  easeCatchUp,
  frameDeltaSeconds,
  hasBrokenFollow,
  indexAtReadPoint,
  linesPerMinuteToPxPerSecond,
  readPointForAnchor,
  type ScrollAnchor,
} from './teleprompter.scroll';
import type { ScriptBlock, TeleprompterController } from './teleprompter.types';

const PAGE_FRACTION = 0.85;
const EXTERNAL_SCROLL_EPSILON = 2;
/** Below this the correction would be invisible and only add jitter. */
const ANCHOR_CORRECTION_EPSILON = 1;

/**
 * Uses layout coordinates because client rects include the teleprompter's CSS
 * transform while scrollTop does not.
 */
function getLayoutTop(element: HTMLElement): number {
  let top = 0;
  let current: HTMLElement | null = element;

  while (current) {
    top += current.offsetTop;
    current = current.offsetParent instanceof HTMLElement ? current.offsetParent : null;
  }

  return top;
}

interface UseTeleprompterScrollArgs {
  initialSpeed: number;
  followLoaded: boolean;
  selectedEventId: string | null;
  readingLinePos: number;
  blocks: ScriptBlock[];
}

/**
 * Owns the scroll position of the teleprompter.
 *
 * The animation frame is the only writer of scrollTop. Controls update refs so
 * smooth scrolling and playback cannot compete for the DOM position.
 */
export function useTeleprompterScroll({
  initialSpeed,
  followLoaded,
  selectedEventId,
  readingLinePos,
  blocks,
}: UseTeleprompterScrollArgs) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const blockRefs = useRef(new Map<string, HTMLElement>());

  const [isScrollerMounted, setIsScrollerMounted] = useState(false);
  const attachScroller = useCallback((element: HTMLDivElement | null) => {
    scrollerRef.current = element;
    setIsScrollerMounted(Boolean(element && contentRef.current));
  }, []);
  const attachContent = useCallback((element: HTMLDivElement | null) => {
    contentRef.current = element;
    setIsScrollerMounted(Boolean(element && scrollerRef.current));
  }, []);

  // authoritative, sub-pixel scroll position
  const posRef = useRef(0);
  const lastTsRef = useRef(0);
  const runningRef = useRef(false);
  const speedRef = useRef(initialSpeed);
  const lineHeightRef = useRef(0);
  const maxScrollRef = useRef(0);
  const catchUpTargetRef = useRef<number | null>(null);
  const pendingDeltaRef = useRef(0);
  // where following last put (or is easing towards putting) the reader
  const followTargetRef = useRef(0);
  // how far the reader has moved the script themselves since following last placed it
  const readerDriftRef = useRef(0);
  // distance from the top of the viewport to the reading line
  const readingOffsetRef = useRef(0);
  const readingLinePosRef = useRef(readingLinePos);
  const selectedEventIdRef = useRef(selectedEventId);
  // the script's layout as of the last measure, and the reader's place in it
  const geometryRef = useRef<BlockGeometry[]>([]);
  const anchorRef = useRef<ScrollAnchor | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  // mirrors the operator view's lockAutoScroll: true once the reader has taken
  // the scroll over by hand, false while following is doing the driving
  const [autoScrollLocked, setAutoScrollLocked] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  const isFollowingRef = useRef(false);
  useEffect(() => {
    isFollowingRef.current = followLoaded && !autoScrollLocked;
  }, [followLoaded, autoScrollLocked]);

  /**
   * One rule for every input, wheel and keyboard alike: once the reader has
   * moved the script far enough themselves, they are driving.
   *
   * Accumulates, so a gesture the browser spreads over many frames adds up to
   * the move it was, and so does a slow drag. Scrolling back where you came
   * from cancels out, which is what keeps momentum and a stray touch from
   * taking the scroll over.
   */
  const addReaderDrift = useCallback((delta: number) => {
    if (!isFollowingRef.current) return;
    readerDriftRef.current += delta;
    if (hasBrokenFollow(readerDriftRef.current, lineHeightRef.current)) {
      setAutoScrollLocked(true);
    }
  }, []);

  const tick = useCallback(
    (timestamp: number) => {
      const el = scrollerRef.current;
      if (!el) return;

      // Adopt wheel, touch, scrollbar, browser-clamp and find-in-page changes.
      // Whatever the position is that the frame loop did not put there is the
      // reader's own doing, which makes this the one place a scroll by hand can
      // be measured, however the browser chose to deliver it.
      const external = el.scrollTop - posRef.current;
      if (Math.abs(external) > EXTERNAL_SCROLL_EPSILON) {
        addReaderDrift(external);
        posRef.current = el.scrollTop;
        catchUpTargetRef.current = null;
      }

      const deltaSeconds = frameDeltaSeconds(timestamp - lastTsRef.current);
      lastTsRef.current = timestamp;

      let next = posRef.current;

      if (pendingDeltaRef.current !== 0) {
        next += pendingDeltaRef.current;
        pendingDeltaRef.current = 0;
        catchUpTargetRef.current = null;
      }

      if (catchUpTargetRef.current !== null) {
        next = easeCatchUp(next, catchUpTargetRef.current, deltaSeconds);
        if (next === catchUpTargetRef.current) {
          catchUpTargetRef.current = null;
        }
      } else if (runningRef.current) {
        const pxPerSecond = linesPerMinuteToPxPerSecond(speedRef.current, lineHeightRef.current);
        const result = advance(next, pxPerSecond, deltaSeconds, maxScrollRef.current);
        next = result.position;
        if (result.atEnd) {
          runningRef.current = false;
          setIsRunning(false);
          setAtEnd(true);
        }
      }

      const clamped = clamp(next, 0, maxScrollRef.current);
      if (clamped !== posRef.current) {
        posRef.current = clamped;
        el.scrollTop = clamped;
      }

      // Remember the reader's place in the script, not just in the document, so
      // the next measure can put them back if the rundown changed underneath
      // them. Reads no layout: the geometry is the one taken at that measure.
      anchorRef.current = anchorAtReadPoint(clamped + readingOffsetRef.current, geometryRef.current);
    },
    [addReaderDrift],
  );

  useEffect(() => {
    lastTsRef.current = performance.now();
    let frame = requestAnimationFrame(function loop(timestamp) {
      tick(timestamp);
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [tick]);

  /** Where following would put the reader for a block, against the last measure. */
  const scrollTargetFor = useCallback((blockId: string): number | null => {
    const block = geometryRef.current.find((entry) => entry.id === blockId);
    if (!block) return null;
    return clamp(block.top - readingOffsetRef.current, 0, maxScrollRef.current);
  }, []);

  const measure = useCallback(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;

    maxScrollRef.current = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    readingOffsetRef.current = (scroller.clientHeight * readingLinePosRef.current) / 100;

    const computed = getComputedStyle(content);
    const parsedLineHeight = Number.parseFloat(computed.lineHeight);
    if (Number.isFinite(parsedLineHeight) && parsedLineHeight > 0) {
      lineHeightRef.current = parsedLineHeight;
    } else {
      const parsedFontSize = Number.parseFloat(computed.fontSize);
      lineHeightRef.current = Number.isFinite(parsedFontSize) ? parsedFontSize * 1.2 : 0;
    }

    const wasEasingToLoadedEvent = catchUpTargetRef.current === followTargetRef.current;

    const previous = geometryRef.current;
    const scrollerTop = getLayoutTop(scroller);
    const geometry: BlockGeometry[] = [];
    blockRefs.current.forEach((element, id) => {
      geometry.push({ id, top: getLayoutTop(element) - scrollerTop, height: element.offsetHeight });
    });
    // registration follows mounting rather than rundown order, so trust layout
    geometry.sort((a, b) => a.top - b.top);
    geometryRef.current = geometry;

    // Put the reader back on the words they were on. Nothing to restore on the
    // first measure, when there is no earlier document to have moved.
    const anchor = anchorRef.current;
    if (anchor && previous.length > 0) {
      const readPoint = readPointForAnchor(
        anchor,
        geometry,
        previous.map((block) => block.id),
      );
      if (readPoint !== null) {
        const target = clamp(readPoint - readingOffsetRef.current, 0, maxScrollRef.current);
        const delta = target - posRef.current;
        if (Math.abs(delta) > ANCHOR_CORRECTION_EPSILON) {
          posRef.current = target;
          scroller.scrollTop = target;
          if (catchUpTargetRef.current !== null) {
            catchUpTargetRef.current = clamp(catchUpTargetRef.current + delta, 0, maxScrollRef.current);
          }
        }
      }
    }

    // The follow target is a position in a document which may have just moved,
    // so take it from the new geometry rather than ageing the old value.
    const selectedId = selectedEventIdRef.current;
    if (selectedId !== null) {
      const followTarget = scrollTargetFor(selectedId);
      if (followTarget !== null) {
        followTargetRef.current = followTarget;
      }
    }

    // Shifting an in-flight ease by the correction is only an estimate. When it
    // was heading for the loaded event we know better: send it to where that
    // event is now, so following still lands exactly on the reading line.
    if (wasEasingToLoadedEvent) {
      catchUpTargetRef.current = followTargetRef.current;
    }
  }, [scrollTargetFor]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const [speedFromOption, setSpeedFromOption] = useState(initialSpeed);
  // Keep the live speed in sync with view-param and remote redirect changes.
  if (speedFromOption !== initialSpeed) {
    setSpeedFromOption(initialSpeed);
    setSpeed(initialSpeed);
  }

  useEffect(() => {
    measure();

    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;

    const observer = new ResizeObserver(() => measure());
    observer.observe(scroller);
    observer.observe(content);
    return () => observer.disconnect();
  }, [measure, isScrollerMounted]);

  useEffect(() => {
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
    };
  }, [measure]);

  useEffect(() => {
    readingLinePosRef.current = readingLinePos;
    measure();
  }, [readingLinePos, measure]);

  /**
   * A resize observer sees the document get taller or shorter, but not a
   * reorder or a rewrite which happens to leave the height alone, and both
   * move the reader's place in the script.
   */
  const contentSignature = blocks.map((block) => `${block.id}:${block.text.length}`).join();
  useEffect(() => {
    measure();
  }, [contentSignature, measure]);

  useEffect(() => {
    const onVisibilityChange = () => {
      lastTsRef.current = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    selectedEventIdRef.current = selectedEventId;
  }, [selectedEventId]);

  // Avoid re-following when a new blocks array contains the same selected event.
  const hasSelectedBlock = selectedEventId !== null && blocks.some((block) => block.id === selectedEventId);

  useEffect(() => {
    if (!followLoaded || autoScrollLocked || !selectedEventId) return;

    const target = scrollTargetFor(selectedEventId);
    if (target === null) return;

    followTargetRef.current = target;
    catchUpTargetRef.current = target;
    readerDriftRef.current = 0;
    setAtEnd(false);
  }, [selectedEventId, followLoaded, autoScrollLocked, readingLinePos, hasSelectedBlock, scrollTargetFor]);

  const registerBlock = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      blockRefs.current.set(id, element);
    } else {
      blockRefs.current.delete(id);
    }
  }, []);

  const controller: TeleprompterController = useMemo(() => {
    const play = () => {
      if (maxScrollRef.current > 0 && posRef.current >= maxScrollRef.current) {
        return;
      }
      runningRef.current = true;
      setIsRunning(true);
      setAtEnd(false);
    };

    const pause = () => {
      runningRef.current = false;
      setIsRunning(false);
    };

    /**
     * Where the scroll is headed rather than where it currently sits, so
     * pressing a step key again before the ease settles moves on by another
     * step instead of re-aiming at the one already in flight.
     */
    const destination = () => catchUpTargetRef.current ?? posRef.current;

    /** Eases to a position the reader asked for, by hand. */
    const goTo = (position: number) => {
      const target = clamp(position, 0, maxScrollRef.current);
      addReaderDrift(target - destination());
      catchUpTargetRef.current = target;
      setAtEnd(false);
    };

    return {
      togglePlay: () => (runningRef.current ? pause() : play()),
      nudge: (lines: number) => {
        const distance = lines * lineHeightRef.current;
        pendingDeltaRef.current += distance;
        addReaderDrift(distance);
        setAtEnd(false);
      },
      page: (direction: 1 | -1) => {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        goTo(destination() + scroller.clientHeight * PAGE_FRACTION * direction);
      },
      jumpEvent: (direction: 1 | -1) => {
        const geometry = geometryRef.current;
        const current = indexAtReadPoint(destination() + readingOffsetRef.current, geometry);
        if (current === -1) return;

        const next = clamp(current + direction, 0, geometry.length - 1);
        goTo(geometry[next].top - readingOffsetRef.current);
      },
      changeSpeed: (delta: number) => setSpeed((current) => clampSpeed(current + delta)),
      rewind: (alsoPause = false) => {
        goTo(0);
        if (alsoPause) pause();
      },
      jumpToEnd: () => {
        addReaderDrift(maxScrollRef.current - destination());
        catchUpTargetRef.current = maxScrollRef.current;
        if (maxScrollRef.current > 0) {
          runningRef.current = false;
          setIsRunning(false);
          setAtEnd(true);
        }
      },
      reengageFollow: () => {
        readerDriftRef.current = 0;
        setAutoScrollLocked(false);
      },
    };
  }, [addReaderDrift]);

  return {
    scrollerRef: attachScroller,
    contentRef: attachContent,
    registerBlock,
    controller,
    isRunning,
    speed,
    // folds followLoaded in, so callers get one ready-to-use signal instead of
    // a runtime flag they must remember to AND with the option themselves
    canReengageFollow: followLoaded && autoScrollLocked,
    atEnd,
  };
}
