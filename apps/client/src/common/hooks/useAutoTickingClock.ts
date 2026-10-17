import { MILLIS_PER_SECOND } from 'ontime-utils';
import { useEffect, useRef, useState } from 'react';

import { getSyncedClock, useClockSyncStore } from '../stores/clockSync';
import { useRuntimeStore } from '../stores/runtime';
import { useIsOnline } from './useSocket';

/** Draws slightly after the second change so the new second is visible */
const tickMarginMs = 10;

/**
 * Counts the clock locally from its offset to the server clock
 * Shows the server value until the offset is known, and freezes while the client is offline
 */
export function useAutoTickingClock(): number {
  const serverClock = useRuntimeStore((state) => state.clock);
  const offset = useClockSyncStore((state) => state.offset);
  const isOnline = useIsOnline();
  const [tick, setTick] = useState(0);
  const lastClockRef = useRef(serverClock);

  // redraws when the clock reaches the next second
  useEffect(() => {
    if (offset === null || !isOnline) {
      return;
    }
    const delay = MILLIS_PER_SECOND - (getSyncedClock(offset, performance.now()) % MILLIS_PER_SECOND) + tickMarginMs;
    const timeout = setTimeout(() => setTick((t) => t + 1), delay);
    return () => clearTimeout(timeout);
  }, [offset, isOnline, tick]);

  if (isOnline) {
    lastClockRef.current = offset === null ? serverClock : getSyncedClock(offset, performance.now());
  }
  return lastClockRef.current;
}
