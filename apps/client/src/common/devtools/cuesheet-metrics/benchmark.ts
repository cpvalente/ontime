/**
 * PERF-METRICS — temporary cuesheet scroll-performance scaffold (delete with this directory).
 *
 * A deterministic, hands-off scroll runner so before/after numbers are comparable. Scrolls the
 * virtualised table from `fromIndex` to `toIndex` and back in fixed index strides, under an
 * active frame-timing session, then dumps the result.
 */
import type { RefObject } from 'react';
import type { TableVirtuosoHandle } from 'react-virtuoso';

import { PERF_ENABLED } from './perfConfig';
import { dump, endSession, snapshot, startSession, type PerfSnapshot } from './perfStore';
import { startFpsMonitor, stopFpsMonitor } from './scrollFpsMonitor';

export interface BenchmarkOptions {
  fromIndex?: number;
  toIndex?: number;
  /** Indices advanced per step. */
  stride?: number;
  /** Delay between steps, ms. */
  stepMs?: number;
}

export async function runScrollBenchmark(
  virtuosoRef: RefObject<TableVirtuosoHandle | null>,
  options: BenchmarkOptions = {},
): Promise<PerfSnapshot | undefined> {
  if (!PERF_ENABLED) {
    // eslint-disable-next-line no-console
    console.warn('[cuesheet-perf] disabled — open the cuesheet with ?perf=1 in a dev build.');
    return undefined;
  }
  const handle = virtuosoRef.current;
  if (!handle) {
    // eslint-disable-next-line no-console
    console.warn('[cuesheet-perf] virtuoso handle not ready.');
    return undefined;
  }

  const { fromIndex = 0, toIndex = 200, stride = 8, stepMs = 16 } = options;

  startSession();
  startFpsMonitor();

  await scrollThrough(handle, fromIndex, toIndex, stride, stepMs);
  await scrollThrough(handle, toIndex, fromIndex, stride, stepMs);

  stopFpsMonitor();
  endSession();
  dump();
  return snapshot();
}

function scrollThrough(
  handle: TableVirtuosoHandle,
  from: number,
  to: number,
  stride: number,
  stepMs: number,
): Promise<void> {
  return new Promise((resolve) => {
    const dir = to >= from ? 1 : -1;
    let current = from;

    const step = () => {
      handle.scrollToIndex({ index: current, behavior: 'auto', align: 'start' });

      if (current === to) {
        resolve();
        return;
      }

      current += stride * dir;
      if ((dir > 0 && current > to) || (dir < 0 && current < to)) {
        current = to;
      }
      setTimeout(step, stepMs);
    };

    step();
  });
}
