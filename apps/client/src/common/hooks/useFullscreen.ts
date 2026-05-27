import { useCallback, useEffect, useState } from 'react';

interface UseFullscreenReturn {
  /** Whether the document is currently in fullscreen mode */
  fullscreen: boolean;
  /**
   * Whether the Fullscreen API is available and permitted in the current browsing context.
   * When false, `toggle` is a no-op and the UI should hide or disable the action.
   */
  isSupported: boolean;
  /**
   * Toggles fullscreen on/off.
   * Safe to use directly as an onClick handler — the underlying Promise is handled
   * internally, so rejections (eg. browser policy, user denial) never surface as
   * unhandled promise rejections.
   */
  toggle: () => void;
}

/**
 * Manages browser fullscreen state.
 *
 * Compared to @mantine/hooks useFullscreen:
 * - `isSupported` is co-located so there is a single source of truth
 * - `toggle` is a plain void callback, safe to pass directly to event handlers
 * - Error handling is internal; callers do not need try/catch
 * - Only targets document.documentElement (the ref API is not used in this project)
 * - No vendor-prefix shims (all supported browsers implement the standard API)
 */
export function useFullscreen(): UseFullscreenReturn {
  const isSupported = Boolean(document.fullscreenEnabled);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    const handleChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggle = useCallback(() => {
    if (!isSupported) return;

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // requestFullscreen() can be rejected in certain browser contexts
        // (eg. browser security policy, extensions blocking fullscreen)
      });
    } else {
      document.exitFullscreen().catch(() => {
        // exitFullscreen() can also be rejected in rare edge cases
      });
    }
  }, [isSupported]);

  return { fullscreen, isSupported, toggle };
}
