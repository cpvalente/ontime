/*
 * Timer implements simple countdown timer functions
 * User needs to use setup function to be able to use
 *
 */

class Timer {
  clock = null;
  duration = null;
  current = null;
  secondaryTimer = null;
  _finishAt = null;
  _finishedAt = null;
  _startedAt = null;
  _pausedAt = null;
  _pausedInterval = null;
  _pausedTotal = null;
  state = 'stop';

  constructor() {}

  // call setup separately
  setupWithSeconds(seconds, autoStart = false) {
    // aux
    const now = this._getCurrentTime();
    this.clock = now;

    // populate targets
    this.duration = seconds * 1000;
    this._finishAt = now + seconds * 1000;

    // start counting
    this._startedAt = now;

    if (autoStart) {
      this.state = 'start';
    } else {
      this._pausedAt = now;
      this._pausedInterval = 0;
    }
    this._pausedTotal = 0;
    this.update();
  }

  // update()
  update() {
    // get current time
    const now = this._getCurrentTime();
    this.clock = now;

    // check playstate
    switch (this.state) {
      case 'start':
        // update current timer
        this.current =
          this._startedAt + this.duration + this._pausedTotal - now;

        break;
      case 'pause':
        // update paused time
        this._pausedInterval = now - this._pausedAt;

        if (this._startedAt != null) {
          // update current timer
          this.current =
            this._startedAt +
            this.duration +
            this._pausedTotal +
            this._pausedInterval -
            now;
        }
        break;
      case 'stop':
        // nothing here yet
        break;
      default:
        console.error('Timer: no playstate on update call', this.state);
        break;
    }

    // Cleanup
    if (this.current <= 0 && this._finishedAt == null) this._finishedAt = now;
  }

  // helpers
  static toSeconds(millis) {
    if (millis == null) return null;
    return Math.floor(Math.max(millis * 0.001), 0);
  }

  // get current time in epoc
  _getCurrentTime() {
    // date today at midnight
    const now = new Date();
    const midnight = new Date(now).setHours(0, 0, 0);

    // return diffence
    return now - midnight;
  }

  _getExpectedFinish() {
    if (this._startedAt == null) return null;
    if (this._finishedAt) return this._finishedAt;

    return Math.max(
      this._startedAt +
        this.duration +
        this._pausedInterval +
        this._pausedTotal,
      this._startedAt
    );
  }

  _resetTimers(total = false) {
    if (total) this.duration = null;
    this.current = this.duration;
    this.secondaryTimer = null;
    this._finishAt = null;
    this._finishedAt = null;
    this._startedAt = null;
    this._pausedAt = null;
    this._pausedInterval = null;
    this._pausedTotal = null;
  }

  // get elapsed time
  getElapsed() {
    return this.duration - this.current;
  }

  // getObject
  getObject() {
    this.update();

    return {
      clock: this.clock,
      running: Timer.toSeconds(this.current),
      secondary: Timer.toSeconds(this.secondaryTimer),
      durationSeconds: Timer.toSeconds(this.duration),
      expectedFinish: this._getExpectedFinish(),
      startedAt: this._startedAt,
    };
  }

  // current time in seconds
  getCurrentInSeconds() {
    // update timeStamp
    this.update();
    return Timer.toSeconds(this.current);
  }

  // playback
  start() {
    // do we need to change
    if (this.state === 'start') return;
    else if (this._startedAt == null) {
      // it hasnt started yet
      const now = this._getCurrentTime();
      // set start time as now
      this._startedAt = now;
      // calculate expected finish time
      this._finishAt = now + this.duration;
      // reset pauses
      this._pausedTotal = null;
      this._pausedInterval = null;
    } else {
      // check if there is paused time
      if (this._pausedInterval) {
        this._pausedTotal += this._pausedInterval;
        this._pausedInterval = null;
      }
    }

    // change state
    this.state = 'start';
  }

  pause() {
    // do we need to change
    if (this.state === 'pause') return;

    if (this._pausedInterval) {
      this._pausedTotal += this._pausedInterval;
      this._pausedInterval = null;
    }

    // set pause time
    this._pausedAt = this._getCurrentTime();

    // change state
    this.state = 'pause';
  }

  stop() {
    // do we need to change
    if (this.state === 'stop') return;

    // clear all timers
    this._resetTimers();

    // change state
    this.state = 'stop';
  }

  increment(amount) {
    this.duration += amount;

    if (amount < 0 && Math.abs(amount) > this.current) {
      // if we will make the clock negative
      if (this._finishedAt == null) this._finishedAt = this._getCurrentTime();
    } else if (this.current < 0 && this.current + amount > 0) {
      // clock will go from negative to positive
      this._finishedAt = null;
    }
  }
}

module.exports = Timer;
