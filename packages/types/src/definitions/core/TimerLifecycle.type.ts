export enum TimerLifeCycle {
  onLoad = 'onLoad',
  onStart = 'onStart',
  onPause = 'onPause',
  onStop = 'onStop',
  onClock = 'onClock',
  onUpdate = 'onUpdate',
  onFinish = 'onFinish',
}

export type TimerLifeCycleKey = keyof typeof TimerLifeCycle;
