import { useEffect, useRef, useState } from 'react';

import { runtimeStore, useRuntimeStore } from '../stores/runtime';
import { ClockEstimate, getEstimatedClock, getNextTickDelay, updateClockEstimate } from './autoTickingClock.utils';

/**
 * Counts the clock locally, using server values only to correct drift
 * The clock freezes while the client is offline
 */
export function useAutoTickingClock(): number {
  const isOnline = useRuntimeStore((state) => state.ping > 0);
  const [tick, setTick] = useState(0);

  const estimateRef = useRef<ClockEstimate | null>(null);
  const lastClockRef = useRef(runtimeStore.getState().clock);

  // Feeds server clock values to the estimator as they arrive, read outside React to keep the arrival time accurate
  useEffect(() => {
    let lastServerClock: number | null = null;

    const handleState = (state: { clock: number; ping: number }) => {
      if (state.ping <= 0) {
        // the first value after reconnecting must snap the clock
        estimateRef.current = null;
        lastServerClock = null;
        return;
      }
      if (state.clock === lastServerClock) {
        return;
      }
      lastServerClock = state.clock;
      estimateRef.current = updateClockEstimate(estimateRef.current, state.clock, performance.now());
      setTick((t) => t + 1);
    };

    handleState(runtimeStore.getState());
    return runtimeStore.subscribe(handleState);
  }, []);

  // Redraws when the estimated clock reaches the next second
  useEffect(() => {
    const estimate = estimateRef.current;
    if (!isOnline || !estimate) {
      return;
    }
    const timeout = setTimeout(() => setTick((t) => t + 1), getNextTickDelay(estimate, performance.now()));
    return () => clearTimeout(timeout);
  }, [isOnline, tick]);

  if (isOnline && estimateRef.current) {
    lastClockRef.current = getEstimatedClock(estimateRef.current, performance.now());
  }
  return lastClockRef.current;
}
