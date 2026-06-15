/**
 * PERF-METRICS — temporary cuesheet scroll-performance scaffold (delete with this directory).
 *
 * Drives a requestAnimationFrame loop while a session is running to capture frame timing
 * (FPS / long-frame count) and, where supported, records main-thread long tasks.
 */
import { PERF_ENABLED } from './perfConfig';
import { recordFrame, recordMark } from './perfStore';

let rafId: number | null = null;
let lastFrame = 0;
let observer: PerformanceObserver | null = null;

export function startFpsMonitor(): void {
  if (!PERF_ENABLED || rafId !== null) return;

  lastFrame = performance.now();
  const tick = (now: number) => {
    recordFrame(now - lastFrame);
    lastFrame = now;
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  if (typeof PerformanceObserver !== 'undefined') {
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          recordMark('longtask', entry.duration);
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch {
      observer = null;
    }
  }
}

export function stopFpsMonitor(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}
