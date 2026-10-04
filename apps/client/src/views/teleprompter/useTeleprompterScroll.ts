import { clampTeleprompterSpeed } from 'ontime-utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  advance,
  anchorAtReadPoint,
  type BlockGeometry,
  clamp,
  easeCatchUp,
  frameDeltaSeconds,
  hasBrokenFollow,
  indexAtReadPoint,
  linesPerMinuteToPxPerSecond,
  readPointForAnchor,
  type ScrollAnchor,
  segmentAfter,
  segmentEndFor,
} from './teleprompter.scroll';
import type { ParkedAt, ScriptBlock, TeleprompterController } from './teleprompter.types';

const PAGE_FRACTION = 0.85;
const EXTERNAL_SCROLL_EPSILON = 2;
/** Below this an anchor correction would be invisible and only add jitter */
const ANCHOR_CORRECTION_EPSILON = 1;

/** Layout coordinates, since client rects include the flip transform and scrollTop does not */
function getLayoutTop(element: HTMLElement): number {
  let top = 0;
  let current: HTMLElement | null = element;

  while (current) {
    top += current.offsetTop;
    current = current.offsetParent instanceof HTMLElement ? current.offsetParent : null;
  }

  return top;
}

function getLineHeight(element: HTMLElement): number {
  const styles = getComputedStyle(element);
  const lineHeight = Number.parseFloat(styles.lineHeight);
  if (Number.isFinite(lineHeight) && lineHeight > 0) {
    return lineHeight;
  }

  const fontSize = Number.parseFloat(styles.fontSize);
  return Number.isFinite(fontSize) ? fontSize * 1.2 : 0;
}

function measureBlockGeometry(scroller: HTMLElement, blocks: Map<string, HTMLElement>): BlockGeometry[] {
  const scrollerTop = getLayoutTop(scroller);
  return Array.from(blocks, ([id, element]) => ({
    id,
    top: getLayoutTop(element) - scrollerTop,
    height: element.offsetHeight,
  })).sort((a, b) => a.top - b.top);
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
  // the segment this run of playback stops at, or null to run to the end of the script
  const playbackSegmentRef = useRef<string | null>(null);
  const followLoadedRef = useRef(followLoaded);

  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  // mirrors the operator view's lockAutoScroll: true once the reader has taken
  // the scroll over by hand, false while following is doing the driving
  const [autoScrollLocked, setAutoScrollLocked] = useState(false);
  const [parkedAt, setParkedAt] = useState<ParkedAt>(null);

  const setPlaybackRunning = useCallback((nextIsRunning: boolean) => {
    runningRef.current = nextIsRunning;
    setIsRunning(nextIsRunning);
  }, []);

  const isFollowingRef = useRef(false);
  // mirrors follow into refs for the frame loop
  useEffect(() => {
    followLoadedRef.current = followLoaded;
    isFollowingRef.current = followLoaded && !autoScrollLocked;
  }, [followLoaded, autoScrollLocked]);

  /**
   * Chooses where playback from a position stops.
   * While following, each event is a cue of its own, so playback stops at the end of the one being read
   * rather than reading on into one nobody has cued. Otherwise it runs to the end of the script.
   */
  const bindPlaybackSegment = useCallback((position: number) => {
    playbackSegmentRef.current = followLoadedRef.current
      ? (segmentAfter(position, readingOffsetRef.current, geometryRef.current)?.id ?? null)
      : null;
  }, []);

  /**
   * Breaks follow once the reader has moved the script far enough, by any input.
   * Accumulates, so a gesture spread over many frames counts as one move and scrolling back cancels out.
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
      const scroller = scrollerRef.current;
      if (!scroller) return;

      // Any change the frame loop did not make is the reader's own (wheel, touch, scrollbar, find in page)
      const external = scroller.scrollTop - posRef.current;
      if (Math.abs(external) > EXTERNAL_SCROLL_EPSILON) {
        addReaderDrift(external);
        posRef.current = scroller.scrollTop;
        catchUpTargetRef.current = null;
        // the reader may have scrolled into another event, which playback should not pull them back from
        if (runningRef.current) bindPlaybackSegment(posRef.current);
      }

      const deltaSeconds = frameDeltaSeconds(timestamp - lastTsRef.current);
      lastTsRef.current = timestamp;

      let next = posRef.current;

      if (catchUpTargetRef.current !== null) {
        next = easeCatchUp(next, catchUpTargetRef.current, deltaSeconds);
        if (next === catchUpTargetRef.current) {
          catchUpTargetRef.current = null;
          // a jump or a follow can land past the segment playback was bound to, which would pull the reader back
          if (runningRef.current) bindPlaybackSegment(next);
        }
      } else if (runningRef.current) {
        // resolved by identity each frame, so an edit which moves the script still stops on the same words
        const stopBlock = geometryRef.current.find((block) => block.id === playbackSegmentRef.current);
        const stop = stopBlock
          ? clamp(segmentEndFor(stopBlock, readingOffsetRef.current), 0, maxScrollRef.current)
          : maxScrollRef.current;

        const pxPerSecond = linesPerMinuteToPxPerSecond(speedRef.current, lineHeightRef.current);
        const result = advance(next, pxPerSecond, deltaSeconds, stop);
        next = Math.min(result.position, stop);
        if (result.atEnd) {
          setPlaybackRunning(false);

          const isLastSegment = stopBlock !== undefined && stopBlock.id === geometryRef.current.at(-1)?.id;
          setParkedAt(isLastSegment || stop >= maxScrollRef.current ? 'script' : 'segment');
        }
      }

      const clamped = clamp(next, 0, maxScrollRef.current);
      if (clamped !== posRef.current) {
        posRef.current = clamped;
        scroller.scrollTop = clamped;
      }

      // against the last measure, so the frame loop reads no layout
      anchorRef.current = anchorAtReadPoint(clamped + readingOffsetRef.current, geometryRef.current);
    },
    [addReaderDrift, bindPlaybackSegment, setPlaybackRunning],
  );

  // runs the frame loop, the only writer of scrollTop
  useEffect(() => {
    lastTsRef.current = performance.now();
    let frame = requestAnimationFrame(function loop(timestamp) {
      tick(timestamp);
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [tick]);

  /** Where following would put the reader for a block, against the last measure */
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

    lineHeightRef.current = getLineHeight(content);

    const wasEasingToLoadedEvent = catchUpTargetRef.current === followTargetRef.current;

    const previousGeometry = geometryRef.current;
    const geometry = measureBlockGeometry(scroller, blockRefs.current);
    geometryRef.current = geometry;

    // put the reader back on the words they were on, if the document moved underneath them
    const anchor = anchorRef.current;
    if (anchor && previousGeometry.length > 0) {
      const readPoint = readPointForAnchor(
        anchor,
        geometry,
        previousGeometry.map((block) => block.id),
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

    const selectedId = selectedEventIdRef.current;
    if (selectedId !== null) {
      const followTarget = scrollTargetFor(selectedId);
      if (followTarget !== null) {
        followTargetRef.current = followTarget;
      }
    }

    // an ease towards the loaded event goes to where that event is now, rather than being shifted by the correction
    if (wasEasingToLoadedEvent) {
      catchUpTargetRef.current = followTargetRef.current;
    }
  }, [scrollTargetFor]);

  // mirrors speed into a ref for the frame loop
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // adopts a new speed from the view options or the remote, while keeping live changes in between
  const [speedFromOption, setSpeedFromOption] = useState(initialSpeed);
  if (speedFromOption !== initialSpeed) {
    setSpeedFromOption(initialSpeed);
    setSpeed(initialSpeed);
  }

  // re-measures whenever the scroller or the script changes size
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

  // re-measures once web fonts have loaded, which changes line heights
  useEffect(() => {
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
    };
  }, [measure]);

  // re-measures for a new reading line position
  useEffect(() => {
    readingLinePosRef.current = readingLinePos;
    measure();
  }, [readingLinePos, measure]);

  // re-measures when the script content changes
  useEffect(() => {
    measure();
  }, [blocks, measure]);

  // restarts frame timing when the tab is shown again, so playback does not jump
  useEffect(() => {
    const onVisibilityChange = () => {
      lastTsRef.current = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // mirrors the loaded event into a ref for measuring
  useEffect(() => {
    selectedEventIdRef.current = selectedEventId;
  }, [selectedEventId]);

  // a boolean, so a new blocks array holding the same loaded event does not re-follow
  const hasSelectedBlock = selectedEventId !== null && blocks.some((block) => block.id === selectedEventId);

  // eases to the loaded event while following
  useEffect(() => {
    if (!followLoaded || autoScrollLocked || !selectedEventId) return;

    const target = scrollTargetFor(selectedEventId);
    if (target === null) return;

    followTargetRef.current = target;
    catchUpTargetRef.current = target;
    readerDriftRef.current = 0;
    setParkedAt(null);
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
      if (runningRef.current) return;
      if (maxScrollRef.current > 0 && posRef.current >= maxScrollRef.current) {
        return;
      }
      bindPlaybackSegment(posRef.current);
      setPlaybackRunning(true);
      setParkedAt(null);
    };

    const pause = () => {
      if (!runningRef.current) return;
      setPlaybackRunning(false);
    };

    /** Where the scroll is headed, so a repeated step key moves on rather than re-aiming at the same target */
    const destination = () => catchUpTargetRef.current ?? posRef.current;

    /** Eases to a position the reader asked for */
    const goTo = (position: number) => {
      const target = clamp(position, 0, maxScrollRef.current);
      addReaderDrift(target - destination());
      catchUpTargetRef.current = target;
      setParkedAt(null);
    };

    return {
      play,
      pause,
      togglePlay: () => (runningRef.current ? pause() : play()),
      nudge: (lines: number) => goTo(destination() + lines * lineHeightRef.current),
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
      changeSpeed: (delta: number) => setSpeed((current) => clampTeleprompterSpeed(current + delta)),
      rewind: () => goTo(0),
      jumpToEnd: () => {
        addReaderDrift(maxScrollRef.current - destination());
        catchUpTargetRef.current = maxScrollRef.current;
        if (maxScrollRef.current > 0) {
          setPlaybackRunning(false);
          setParkedAt('script');
        }
      },
      reengageFollow: () => {
        readerDriftRef.current = 0;
        setAutoScrollLocked(false);
      },
    };
  }, [addReaderDrift, bindPlaybackSegment, setPlaybackRunning]);

  return {
    scrollerRef: attachScroller,
    contentRef: attachContent,
    registerBlock,
    controller,
    isRunning,
    speed,
    canReengageFollow: followLoaded && autoScrollLocked,
    parkedAt,
  };
}
