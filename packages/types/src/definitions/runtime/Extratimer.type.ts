export type SimplePlayback = 'play' | 'pause' | 'stop';

export type SimpleTimerState = {
  duration: number;
  current: number;
  playback: SimplePlayback;
};
