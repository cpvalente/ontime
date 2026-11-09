import { dayInMs } from 'ontime-utils';

import { runtimeStore } from '../../common/stores/runtime';

/** A server clock this far from the one counted locally has drifted, closer is the delay of the network */
const driftToleranceMs = 50;

/** The last server clock adopted, and when it arrived */
let baseline = { clock: runtimeStore.getState().clock, receivedAt: performance.now() };

// the server publishes its time of day every second, which arrives with a different delay each time
runtimeStore.subscribe((state, previous) => {
  if (state.clock === previous.clock) return;
  const drift = Math.abs(state.clock - serverNow());
  // a day apart is the same time of day, just after midnight on either side
  if (Math.min(drift, dayInMs - drift) > driftToleranceMs) {
    baseline = { clock: state.clock, receivedAt: performance.now() };
  }
});

/**
 * Now, as the server's time of day, which the teleprompter transport is timed against
 * Every Ontime client shares the server clock, so every screen calculates the same line
 */
export function serverNow(): number {
  return (baseline.clock + performance.now() - baseline.receivedAt) % dayInMs;
}
