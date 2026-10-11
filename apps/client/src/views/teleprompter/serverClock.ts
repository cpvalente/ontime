import { dayInMs } from 'ontime-utils';

import { runtimeStore } from '../../common/stores/runtime';

/** The last server clock received, and when it arrived */
let baseline = { clock: runtimeStore.getState().clock, receivedAt: performance.now() };

// the server publishes its time of day every second
runtimeStore.subscribe((state, previous) => {
  if (state.clock !== previous.clock) {
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
