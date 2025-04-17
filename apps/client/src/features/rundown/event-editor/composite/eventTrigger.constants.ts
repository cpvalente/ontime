import { TimerLifeCycle } from 'ontime-types';

export const eventTriggerOptions: TimerLifeCycle[] = [
  TimerLifeCycle.onLoad,
  TimerLifeCycle.onStart,
  TimerLifeCycle.onPause,
  TimerLifeCycle.onFinish,
  TimerLifeCycle.onWarning,
  TimerLifeCycle.onDanger,
];
