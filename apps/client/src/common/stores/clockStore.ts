import { create } from 'zustand';

import { getDisplayedClock, getLocalUtcOffset, hasPublishedClockJumped } from '../utils/clockSync';

/** The clock in whole seconds, in the browser's timezone once measured, the published server time of day until then, ticked locally once for every reader, also while the server is unreachable. */
export const useAutoTickingClock = create<number>(() => 0);

// maps performance.now to the published time of day until measured, then to the server epoch
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
    return hasPublishedClockJumped(publishedOffset, getShownOffset(), publishedClockUncertaintyMs);
  }
  offset = publishedOffset;
  tick();
  return false;
}

/** The measured offset is to the server epoch, shown in the browser's timezone. */
export function setMeasuredClockOffset(epochOffset: number) {
  hasMeasurement = true;
  offset = epochOffset;
  tick();
}

/** The browser timezone is read on every tick, so a daylight saving change shows at once. */
function getShownOffset(): number {
  // daylight saving is read at the server time, the browser date may be wrong
  return hasMeasurement ? offset + getLocalUtcOffset(performance.now() + offset) : offset;
}

/** One local schedule lasts for the client session, including disconnection and view changes. */
function tick() {
  // nothing is shown before the first tick
  const shown = tickTimeout === null ? null : useAutoTickingClock.getState();
  clearTimeout(tickTimeout ?? undefined);
  const { clock, untilNextSecond } = getDisplayedClock(getShownOffset(), performance.now(), shown);
  tickTimeout = setTimeout(tick, untilNextSecond);
  useAutoTickingClock.setState(clock, true);
}
