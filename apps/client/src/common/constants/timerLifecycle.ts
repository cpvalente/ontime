import { TimerLifeCycle } from 'ontime-types';

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

export function getLifecycleLabel(cycle: TimerLifeCycle | string): string {
  return lifecycleLabels[cycle as TimerLifeCycle] ?? cycle;
}
