/**
 * Polyfills for old WebOS TV browsers (Chromium ~38-56).
 * This file is injected via additionalLegacyPolyfills in vite.config.js
 * and only runs in the legacy (nomodule) code path.
 */

// ResizeObserver — not available in Chrome < 64
import { ResizeObserver as ResizeObserverPolyfill } from '@juggle/resize-observer';
if (typeof window.ResizeObserver === 'undefined') {
  window.ResizeObserver = ResizeObserverPolyfill;
}
