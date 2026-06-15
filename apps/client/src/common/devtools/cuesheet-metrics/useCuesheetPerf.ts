/**
 * PERF-METRICS — temporary cuesheet scroll-performance scaffold (delete with this directory).
 *
 * Wires the metrics scaffold into the cuesheet table. When enabled (`?perf=1` in a dev build) it
 * exposes a console API on `window.__cuesheetPerf` and is otherwise an inert no-op.
 *
 *   __cuesheetPerf.runScrollBenchmark()   // deterministic scroll, dumps a comparable result
 *   __cuesheetPerf.start()                // begin a manual session (then scroll by hand)
 *   __cuesheetPerf.stop()                 // end the manual session and dump
 */
import { useEffect, type RefObject } from 'react';
import type { TableVirtuosoHandle } from 'react-virtuoso';

import { runScrollBenchmark, type BenchmarkOptions } from './benchmark';
import { PERF_ENABLED } from './perfConfig';
import { dump, endSession, reset, startSession } from './perfStore';
import { startFpsMonitor, stopFpsMonitor } from './scrollFpsMonitor';

export function useCuesheetPerf(virtuosoRef: RefObject<TableVirtuosoHandle | null>): void {
  useEffect(() => {
    if (!PERF_ENABLED) return;

    const api = {
      runScrollBenchmark: (options?: BenchmarkOptions) => runScrollBenchmark(virtuosoRef, options),
      start: () => {
        startSession();
        startFpsMonitor();
      },
      stop: () => {
        stopFpsMonitor();
        endSession();
        dump();
      },
      dump,
      reset,
    };

    (window as unknown as { __cuesheetPerf?: typeof api }).__cuesheetPerf = api;
    // eslint-disable-next-line no-console
    console.info('[cuesheet-perf] enabled. window.__cuesheetPerf = { runScrollBenchmark, start, stop, dump, reset }');

    return () => {
      stopFpsMonitor();
      delete (window as unknown as { __cuesheetPerf?: typeof api }).__cuesheetPerf;
    };
  }, [virtuosoRef]);
}
