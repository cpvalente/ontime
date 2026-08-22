import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  advance,
  clamp,
  clampSpeed,
  easeCatchUp,
  frameDeltaSeconds,
  hasBrokenFollow,
  linesPerMinuteToPxPerSecond,
} from './teleprompter.scroll';
import type { ScriptBlock, TeleprompterController } from './teleprompter.types';

const PAGE_FRACTION = 0.85;
const EXTERNAL_SCROLL_EPSILON = 2;

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
  // where following last put (or is easing towards putting) the reader, so a
  // user scroll can be measured against it rather than breaking on any input
  const followTargetRef = useRef(0);

  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  // mirrors the operator view's lockAutoScroll: true once the reader has taken
  // the scroll over by hand, false while following is doing the driving
  const [autoScrollLocked, setAutoScrollLocked] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  const tick = useCallback((timestamp: number) => {
    const el = scrollerRef.current;
    if (!el) return;

    // Adopt wheel, touch, scrollbar, browser-clamp and find-in-page changes.
    if (Math.abs(el.scrollTop - posRef.current) > EXTERNAL_SCROLL_EPSILON) {
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
  }, []);

  useEffect(() => {
    lastTsRef.current = performance.now();
    let frame = requestAnimationFrame(function loop(timestamp) {
      tick(timestamp);
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [tick]);

  const measure = useCallback(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;

    maxScrollRef.current = Math.max(0, scroller.scrollHeight - scroller.clientHeight);

    const computed = getComputedStyle(content);
    const parsedLineHeight = Number.parseFloat(computed.lineHeight);
    if (Number.isFinite(parsedLineHeight) && parsedLineHeight > 0) {
      lineHeightRef.current = parsedLineHeight;
    } else {
      const parsedFontSize = Number.parseFloat(computed.fontSize);
      lineHeightRef.current = Number.isFinite(parsedFontSize) ? parsedFontSize * 1.2 : 0;
    }
  }, []);

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
    const onVisibilityChange = () => {
      lastTsRef.current = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // Avoid re-following when a new blocks array contains the same selected event.
  const hasSelectedBlock = selectedEventId !== null && blocks.some((block) => block.id === selectedEventId);

  useEffect(() => {
    if (!followLoaded || autoScrollLocked || !selectedEventId) return;

    const scroller = scrollerRef.current;
    const target = blockRefs.current.get(selectedEventId);
    if (!scroller || !target) return;

    const offset = (scroller.clientHeight * readingLinePos) / 100;
    const top = getLayoutTop(target) - getLayoutTop(scroller) - offset;
    const clamped = clamp(top, 0, maxScrollRef.current);

    followTargetRef.current = clamped;
    catchUpTargetRef.current = clamped;
    setAtEnd(false);
  }, [selectedEventId, followLoaded, autoScrollLocked, readingLinePos, hasSelectedBlock]);

  /**
   * Only a real scroll away from the follow target takes over: momentum after a
   * deliberate gesture, or a stray touch, would otherwise break it on any input,
   * which is what made the operator view move to a distance check instead.
   *
   * Reads scrollTop from the element rather than posRef: a burst of wheel
   * events can fire faster than the animation frame that keeps posRef in sync,
   * so posRef here can still be reporting where the gesture started.
   */
  const handleUserScroll = useCallback(() => {
    if (!followLoaded || autoScrollLocked) return;
    const position = scrollerRef.current?.scrollTop;
    if (position === undefined) return;
    if (hasBrokenFollow(position, followTargetRef.current, lineHeightRef.current)) {
      setAutoScrollLocked(true);
    }
  }, [followLoaded, autoScrollLocked]);

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

    return {
      togglePlay: () => (runningRef.current ? pause() : play()),
      nudge: (lines: number) => {
        pendingDeltaRef.current += lines * lineHeightRef.current;
        setAtEnd(false);
      },
      page: (direction: 1 | -1) => {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        const distance = scroller.clientHeight * PAGE_FRACTION * direction;
        catchUpTargetRef.current = clamp(posRef.current + distance, 0, maxScrollRef.current);
        setAtEnd(false);
      },
      changeSpeed: (delta: number) => setSpeed((current) => clampSpeed(current + delta)),
      rewind: (alsoPause = false) => {
        catchUpTargetRef.current = 0;
        if (alsoPause) pause();
        setAtEnd(false);
      },
      jumpToEnd: () => {
        catchUpTargetRef.current = maxScrollRef.current;
        if (maxScrollRef.current > 0) {
          runningRef.current = false;
          setIsRunning(false);
          setAtEnd(true);
        }
      },
      reengageFollow: () => setAutoScrollLocked(false),
    };
  }, []);

  return {
    scrollerRef: attachScroller,
    contentRef: attachContent,
    registerBlock,
    handleUserScroll,
    controller,
    isRunning,
    speed,
    // folds followLoaded in, so callers get one ready-to-use signal instead of
    // a runtime flag they must remember to AND with the option themselves
    canReengageFollow: followLoaded && autoScrollLocked,
    atEnd,
  };
}
