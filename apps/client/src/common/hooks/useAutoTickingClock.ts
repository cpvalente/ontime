import { MILLIS_PER_SECOND } from 'ontime-utils';
import { useEffect, useState } from 'react';

import { getSyncedClock, useClockSyncStore } from '../stores/clockSync';
import { useRuntimeStore } from '../stores/runtime';

/** Draws slightly after the second change so the new second is visible */
const tickMarginMs = 10;

/**
 * Counts the clock locally from its offset to the server clock
 * Shows the server value until the offset is known
 */
export function useAutoTickingClock(): number {
  const serverClock = useRuntimeStore((state) => state.clock);
  const offset = useClockSyncStore((state) => state.offset);
  const [tick, setTick] = useState(0);

  // redraws when the clock reaches the next second
  useEffect(() => {
    if (offset === null) {
      return;
    }
    const delay = MILLIS_PER_SECOND - (getSyncedClock(offset, performance.now()) % MILLIS_PER_SECOND) + tickMarginMs;
    const timeout = setTimeout(() => setTick((t) => t + 1), delay);
    return () => clearTimeout(timeout);
  }, [offset, tick]);

  if (offset === null) {
    return serverClock;
  }
  return getSyncedClock(offset, performance.now());
}
