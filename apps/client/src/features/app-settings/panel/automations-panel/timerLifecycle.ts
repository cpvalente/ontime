import { TimerLifeCycle } from 'ontime-types';

/**
 * User facing labels for the timer lifecycle
 * Shared between the automation settings and the rundown event editor
 * so that a lifecycle is named the same everywhere it is shown
 */
export const lifecycleLabels: Record<TimerLifeCycle, string> = {
  [TimerLifeCycle.onLoad]: 'On Load',
  [TimerLifeCycle.onStart]: 'On Start',
  [TimerLifeCycle.onPause]: 'On Pause',
  [TimerLifeCycle.onStop]: 'On Stop',
  [TimerLifeCycle.onClock]: 'Every second',
  [TimerLifeCycle.onUpdate]: 'On Timer Update',
  [TimerLifeCycle.onFinish]: 'On Finish',
  [TimerLifeCycle.onWarning]: 'On Warning',
  [TimerLifeCycle.onDanger]: 'On Danger',
};

/**
 * Resolves a lifecycle to its user facing label, falling back to the raw value
 */
export function getLifecycleLabel(cycle: TimerLifeCycle | string): string {
  return lifecycleLabels[cycle as TimerLifeCycle] ?? cycle;
}
