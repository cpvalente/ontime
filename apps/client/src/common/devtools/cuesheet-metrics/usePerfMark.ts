/**
 * PERF-METRICS — temporary cuesheet scroll-performance scaffold (delete with this directory).
 *
 * Lightweight timing helpers. All no-op when instrumentation is disabled so the call sites in
 * shared components stay cheap (and fold away in production builds).
 */
import { useLayoutEffect, useRef } from 'react';

import { PERF_ENABLED } from './perfConfig';
import { recordMark, recordRowMount } from './perfStore';

/** Times the synchronous `fn`, records the duration under `name`, and returns its result. */
export function timeSync<T>(name: string, fn: () => T): T {
  if (!PERF_ENABLED) return fn();
  const start = performance.now();
  try {
    return fn();
  } finally {
    recordMark(name, performance.now() - start);
  }
}

/**
 * Measures the mount cost of a component (render-start → post-commit layout) and records it
 * under `${name}.mount`. Used on EventRow and on the Tooltip subtree to attribute per-row
 * first-render cost. Pass `countAsRow` on the row probe so only rows feed the rows-mounted tally.
 */
export function useMountProbe(name: string, countAsRow = false): void {
  const renderStart = useRef(PERF_ENABLED ? performance.now() : 0);
  useLayoutEffect(() => {
    if (!PERF_ENABLED) return;
    recordMark(`${name}.mount`, performance.now() - renderStart.current);
    if (countAsRow) {
      recordRowMount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only probe
  }, []);
}
