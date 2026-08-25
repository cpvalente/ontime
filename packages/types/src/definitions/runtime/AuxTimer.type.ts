export enum SimplePlayback {
  Start = 'start',
  Pause = 'pause',
  Stop = 'stop',
}

export enum SimpleDirection {
  CountUp = 'count-up',
  CountDown = 'count-down',
}

export type SimpleTimerState = {
  duration: number;
  current: number;
  playback: SimplePlayback;
  direction: SimpleDirection;
  /** Custom name for the aux timer. Empty string when unnamed */
  name: string;
};
