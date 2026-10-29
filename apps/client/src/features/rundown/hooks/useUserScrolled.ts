import { useCallback, useRef } from 'react';

const userScrollEvents = ['wheel', 'touchmove', 'pointerdown', 'keydown'] as const;
const scrollKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

/**
 * Tracks user scroll intent from the wheel, touch, scrollbar or focused list's keyboard
 * - lets a follow mode hold its position through content changes until the user takes over
 * - pass scrollerRef to the virtuoso list, reset userScrolledRef when following again
 */
export function useUserScrolled() {
  const userScrolledRef = useRef(false);
  const elementRef = useRef<HTMLElement | null>(null);

  const markScrolled = useCallback((event: Event) => {
    // Only keys on the list itself indicate native scrolling; fields and table cells own their keys.
    if (
      event instanceof KeyboardEvent &&
      (event.target !== elementRef.current || event.defaultPrevented || !scrollKeys.has(event.key))
    ) {
      return;
    }
    // a pointer on the scroller itself is its scrollbar, a click on a row is not a scroll
    if (event.type === 'pointerdown' && event.target !== elementRef.current) {
      return;
    }
    userScrolledRef.current = true;
  }, []);

  const scrollerRef = useCallback(
    (element: HTMLElement | Window | null) => {
      userScrollEvents.forEach((name) => elementRef.current?.removeEventListener(name, markScrolled));
      elementRef.current = element instanceof HTMLElement ? element : null;
      userScrollEvents.forEach((name) => elementRef.current?.addEventListener(name, markScrolled, { passive: true }));
    },
    [markScrolled],
  );

  return { userScrolledRef, scrollerRef };
}
