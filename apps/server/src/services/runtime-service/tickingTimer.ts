import type { Instant, MaybeNumber } from 'ontime-types';

import * as timeCore from '../../lib/time-core/timeCore.js';

type TickingTimerOptions = {
  /** how often we tick, in milliseconds */
  interval: number;
  onTick: (at: Instant) => void;
};

export type TickingTimer = ReturnType<typeof createTickingTimer>;

/**
 * Ticks at a regular interval, and ahead of it for boundaries which fall between ticks
 * Knows nothing of what a tick does
 */
export function createTickingTimer({ interval, onTick }: TickingTimerOptions) {
  let intervalTimer: NodeJS.Timeout | undefined;
  /** anticipates a boundary which falls inside the current interval */
  let boundaryTimer: NodeJS.Timeout | undefined;

  const tick = () => onTick(timeCore.now());

  function clearBoundary() {
    clearTimeout(boundaryTimer);
    boundaryTimer = undefined;
  }

  return {
    start() {
      intervalTimer ??= setInterval(tick, interval);
    },

    stop() {
      clearInterval(intervalTimer);
      intervalTimer = undefined;
      clearBoundary();
    },

    /**
     * The interval can only resolve a boundary on its own tick
     * If the next boundary falls before the next tick, we schedule a tick for it
     * Must be called whenever the boundary may have moved
     */
    scheduleBoundary(msUntil: MaybeNumber) {
      clearBoundary();

      if (!intervalTimer || msUntil === null || msUntil >= interval) {
        return;
      }

      // a due boundary is already being resolved by the tick that found it
      // rescheduling it would spin the timer if the tick fails to clear the boundary
      if (msUntil <= 0) {
        return;
      }

      boundaryTimer = setTimeout(tick, msUntil);
    },
  };
}
