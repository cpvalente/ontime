export type SimplePlayback = 'play' | 'pause' | 'stop';
export type SimpleDirection = 'up' | 'down';

export type SimpleTimerState = {
  duration: number;
  current: number;
  playback: SimplePlayback;
  direction: SimpleDirection;
};
