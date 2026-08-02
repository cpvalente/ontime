import { useEffect } from 'react';

let openCount = 0;

/**
 * Tracks how many modals or dialogs are currently open.
 *
 * Base UI dismisses its own popup on Escape via a listener bound directly to
 * `document`, independently of the React tree. Global Escape handlers (e.g.
 * closing the settings panel) are bound the same way, and `stopPropagation()`
 * cannot suppress a sibling listener on the same node, so both would fire on
 * every Escape press. Global handlers check `hasOpenOverlay()` and stand
 * down instead, letting the topmost overlay own the key.
 */
export function useRegisterOverlay(isOpen: boolean): void {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    openCount += 1;
    return () => {
      openCount -= 1;
    };
  }, [isOpen]);
}

/** Whether a modal or dialog currently owns the Escape key. Read at call time, not reactive. */
export function hasOpenOverlay(): boolean {
  return openCount > 0;
}
