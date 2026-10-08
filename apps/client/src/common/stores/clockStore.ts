import { create } from 'zustand';

import { getDisplayedClock } from '../utils/clockSync';

/** The server clock in whole seconds, ticked locally once for every reader, also while the server is unreachable. */
export const useAutoTickingClock = create<number>(() => 0);

let offset = 0;
let hasMeasurement = false;
let tickTimeout: ReturnType<typeof setTimeout> | null = null;

/** Published clocks seed local ticking until Ping/Pong provides the measured offset. */
export function setPublishedClock(clock: number) {
  if (hasMeasurement || !Number.isFinite(clock)) {
    return;
  }
  offset = clock - performance.now();
  tick();
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
