import { useCallback, useRef } from 'react';

const scrollerEvents = ['wheel', 'touchmove', 'pointerdown'] as const;
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
    const element = elementRef.current;
    if (!element) {
      return;
    }
    // ctrl + wheel zooms, and a sideways wheel scrolls the cuesheet's columns rather than its rows
    if (event instanceof WheelEvent && (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY))) {
      return;
    }
    // only a pointer on the scrollbar itself scrolls; clicks on rows, padding or empty space do not
    if (
      event.type === 'pointerdown' &&
      (event.target !== element || !(event instanceof MouseEvent) || event.offsetX < element.clientWidth)
    ) {
      return;
    }
    userScrolledRef.current = true;
  }, []);

  // Listening on the window runs after app hotkeys, which prevent the native scroll of the keys they handle.
  // Only keys on the list itself scroll it natively; fields and table cells own their keys.
  const markKeyScrolled = useCallback((event: KeyboardEvent) => {
    if (
      event.target !== elementRef.current ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      !scrollKeys.has(event.key)
    ) {
      return;
    }
    userScrolledRef.current = true;
  }, []);

  const scrollerRef = useCallback(
    (element: HTMLElement | Window | null) => {
      scrollerEvents.forEach((name) => elementRef.current?.removeEventListener(name, markScrolled));
      window.removeEventListener('keydown', markKeyScrolled);
      elementRef.current = element instanceof HTMLElement ? element : null;
      if (elementRef.current) {
        scrollerEvents.forEach((name) => elementRef.current?.addEventListener(name, markScrolled, { passive: true }));
        window.addEventListener('keydown', markKeyScrolled);
      }
    },
    [markScrolled, markKeyScrolled],
  );

  return { userScrolledRef, scrollerRef };
}
