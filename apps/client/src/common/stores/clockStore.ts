import { create } from 'zustand';

import { getDisplayedClock, hasClockJumped } from '../utils/clockSync';

/** The server clock in whole seconds, ticked locally once for every reader, also while the server is unreachable. */
export const useAutoTickingClock = create<number>(() => 0);

let offset = 0;
let hasMeasurement = false;
let tickTimeout: ReturnType<typeof setTimeout> | null = null;

// a published clock arrives after its network and publishing delay
const publishedClockUncertaintyMs = 1000;

/**
 * Published clocks seed local ticking until Ping/Pong provides the measured offset.
 * Afterwards, returns whether the published clock disagrees with the measurement, eg: the server clock jumped or the client slept.
 */
export function setPublishedClock(clock: number): boolean {
  if (!Number.isFinite(clock)) {
    return false;
  }
  const publishedOffset = clock - performance.now();
  if (hasMeasurement) {
    return hasClockJumped(publishedOffset, offset, publishedClockUncertaintyMs);
  }
  offset = publishedOffset;
  tick();
  return false;
}

export function setMeasuredClockOffset(measuredOffset: number) {
  hasMeasurement = true;
  offset = measuredOffset;
  tick();
}

/** One local schedule lasts for the client session, including disconnection and view changes. */
function tick() {
  // nothing is shown before the first tick
  const shown = tickTimeout === null ? null : useAutoTickingClock.getState();
  clearTimeout(tickTimeout ?? undefined);
  const { clock, untilNextSecond } = getDisplayedClock(offset, performance.now(), shown);
  tickTimeout = setTimeout(tick, untilNextSecond);
  useAutoTickingClock.setState(clock, true);
}
