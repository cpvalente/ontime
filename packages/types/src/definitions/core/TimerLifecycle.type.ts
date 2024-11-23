export enum TimerLifeCycle {
  onLoad = 'onLoad',
  onStart = 'onStart',
  onPause = 'onPause',
  onStop = 'onStop',
  onClock = 'onClock',
  onUpdate = 'onUpdate',
  onFinish = 'onFinish',
  onWarning = 'onWarning',
  onDanger = 'onDanger',
}

export type TimerLifeCycleKey = keyof typeof TimerLifeCycle;

export const timerLifecycleValues = Object.keys(TimerLifeCycle);
