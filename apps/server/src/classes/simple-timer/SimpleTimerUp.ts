import { SimpleTimerState } from 'ontime-types';

export class SimpleTimerUp {
  state: SimpleTimerState = {
    duration: 0,
    current: 0,
    playback: 'stop',
  };
  private startedAt: number | null = null;
  private pausedAt: number | null = null;

  constructor() {}

  public reset() {
    this.state = {
      duration: 0,
      current: 0,
      playback: 'stop',
    };
  }

  public setTime(time: number): SimpleTimerState {
    this.state.current = time;
    return this.state;
  }

  public play(timeNow: number): SimpleTimerState {
    if (this.state.playback === 'pause') {
      const elapsedSincePause = this.pausedAt - this.startedAt;
      this.startedAt = timeNow - elapsedSincePause;
    } else if (this.state.playback === 'stop') {
      this.startedAt = timeNow;
    }
    this.state.playback = 'play';
    return this.update(timeNow);
  }

  public pause(timeNow: number): SimpleTimerState {
    this.state.playback = 'pause';
    this.pausedAt = timeNow;
    return this.state;
  }

  public stop(): SimpleTimerState {
    this.state.playback = 'stop';
    this.state.current = 0;
    this.startedAt = null;
    return this.state;
  }

  public update(timeNow: number): SimpleTimerState {
    if (this.state.playback === 'play') {
      this.state.current = timeNow - this.startedAt;
    }

    return this.state;
  }
}
