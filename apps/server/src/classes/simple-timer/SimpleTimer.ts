import { SimpleDirection, SimplePlayback, SimpleTimerState } from 'ontime-types';

export class SimpleTimer {
  state: SimpleTimerState = {
    duration: 0,
    current: 0,
    playback: SimplePlayback.Stop,
    direction: SimpleDirection.CountDown,
  };
  private startedAt: number | null = null;
  private pausedAt: number | null = null;
  private initialDuration = 0;

  constructor(initialTime: number = 0) {
    this.state.duration = initialTime;
    this.initialDuration = initialTime;
    this.state.current = initialTime;
  }

  public reset() {
    this.state = {
      duration: 0,
      current: 0,
      playback: SimplePlayback.Stop,
      direction: SimpleDirection.CountDown,
    };
  }

  /**
   * Sets the duration of the timer
   * @param time - time in milliseconds
   */
  public setTime(time: number): SimpleTimerState {
    this.state.duration = time;
    this.initialDuration = time;
    this.state.current = time;
    return this.state;
  }

  public addTime(millis: number): SimpleTimerState {
    this.state.duration += millis;
    // the value of current will be overridden when update is called,
    // but if we are in pause or stop state it will not be changed so we do it here
    this.state.current += millis;
    return this.state;
  }

  public setDirection(direction: SimpleDirection, timeNow: number): SimpleTimerState {
    // if we are playing, we need to reset the targets
    if (this.state.playback === SimplePlayback.Start) {
      this.startedAt = timeNow;
      this.state.duration = this.state.current;
    }
    this.state.direction = direction;
    this.update(timeNow);
    return this.state;
  }

  public start(timeNow: number): SimpleTimerState {
    if (this.state.playback === SimplePlayback.Pause) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know these are not null in a timer that is paused
      const elapsedSincePause = this.pausedAt! - this.startedAt!;
      this.startedAt = timeNow - elapsedSincePause;
    } else if (this.state.playback === SimplePlayback.Stop) {
      this.startedAt = timeNow;
    }
    this.state.playback = SimplePlayback.Start;
    return this.update(timeNow);
  }

  public pause(timeNow: number): SimpleTimerState {
    if (this.state.playback !== SimplePlayback.Start) return this.state;
    this.state.playback = SimplePlayback.Pause;
    this.pausedAt = timeNow;
    return this.state;
  }

  public stop(): SimpleTimerState {
    this.state.playback = SimplePlayback.Stop;
    this.state.duration = this.initialDuration;
    this.state.current = this.initialDuration;
    this.startedAt = null;
    return this.state;
  }

  public update(timeNow: number): SimpleTimerState {
    if (this.state.playback === SimplePlayback.Start) {
      // we know startedAt is not null since we are in play mode
      const elapsed = timeNow - this.startedAt;
      if (this.state.direction === SimpleDirection.CountDown) {
        this.state.current = this.state.duration - elapsed;
      } else if (this.state.direction === SimpleDirection.CountUp) {
        this.state.current = this.state.duration + elapsed;
      }
    }

    return this.state;
  }
}
