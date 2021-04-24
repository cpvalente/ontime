/*
 * Timer implements simple countdown timer functions
 * User needs to use setup function to be able to use
 *
 */

class Timer {
  clock = null;
  duration = null;
  current = null;
  _finishAt = null;
  _startedAt = null;
  _pausedAt = null;
  _pausedInterval = null;
  _pausedTotal = null;
  state = 'stop';
  showNegative = false;

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
        if (!this.showNegative) {
          this.current = Math.max(this._finishAt + this._pausedTotal - now, 0);
        } else {
          (this.current = this._finishAt + this._pausedTotal - now), 0;
        }
        break;
      case 'pause':
        // update paused time
        this._pausedInterval = now - this._pausedAt;
        break;
      case 'stop':
        // nothing here yet
        break;
      default:
        console.error('Timer: no playstate on update call', this.state);
        break;
    }
  }

  // helpers
  static toSeconds(millis) {
    return Math.floor(Math.max(millis * 0.001), 0);
  }

  // get current time in epoc
  _getCurrentTime() {
    // date today at midnight
    let now = new Date();
    let midnight = new Date(now).setHours(0, 0, 0);

    // return diffence
    return now - midnight;
  }

  _getExpectedFinish() {
    if (this._finishAt == null) return null;
    return this._finishAt + (this._pausedInterval + this._pausedTotal);
  }

  _resetTimers() {
    this.current = this.duration;
    this._finishAt = null;
    this._startedAt = null;
    this._pausedAt = null;
    this._pausedInterval = null;
    this._pausedTotal = null;
  }

  // getObject
  getObject() {
    this.update();

    return {
      clock: this.clock,
      currentSeconds: Timer.toSeconds(this.current),
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

  get playState() {
    return this.state;
  }

  // playback
  start() {
    // do we need to change
    if (this.state === 'start') return;
    else if (this.startedAt == null) {
      const now = this._getCurrentTime();
      this._startedAt = now;
      this._finishAt = now + this.duration;
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

    // update pause time
    this._pausedAt = this._getCurrentTime();

    // change state
    this.state = 'pause';
  }
  stop() {
    // do we need to change
    if (this.state === 'stop') return;

    // clear all timers
    this._resetTimers();
    this.state = 'stop';
  }
}

module.exports = Timer;
