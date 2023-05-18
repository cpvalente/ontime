export enum TimerLifeCycle {
  onLoad = 'onLoad',
  onStart = 'onStart',
  onPause = 'onPause',
  onStop = 'onStop',
  onUpdate = 'onUpdate',
  onFinish = 'onFinish',
}

export type TimerLifeCycleKey = keyof typeof TimerLifeCycle;
