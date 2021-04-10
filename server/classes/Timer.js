/*
 * Timer implements simple countdown timer functions
 * User needs to use setup function to be able to use
 *
 */

class Timer {
  _current = null;
  _finishAt = null;
  _startedAt = null;
  _pausedAt = null;
  _pausedInterval = null;
  _pausedTotal = null;
  state = 'pause';
  showNegative = false;

  constructor() {}

  // call setup separately
  setupWithSeconds(seconds, autoStart = false) {
    // aux
    const now = new Date().getTime();

    // populate targets
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
    const now = new Date().getTime();

    // check playstate
    switch (this.state) {
      case 'start':
        // update current timer
        if (!this.showNegative) {
          this._current = Math.max(this._finishAt + this._pausedTotal - now, 0);
        } else {
          (this._current = this._finishAt + this._pausedTotal - now), 0;
        }
        break;
      case 'pause':
        // update paused time
        this._pausedInterval = now - this._pausedAt;
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

  _getExpectedFinish() {
    return this._finishAt + (this._pausedInterval + this._pausedTotal);
  }

  // getObject
  getObject() {
    this.update();
    return {
      currentSeconds: Timer.toSeconds(this._current),
      expectedFinish: this._getExpectedFinish(),
      startedAt: this._startedAt,
    };
  }

  // current time in seconds
  getCurrentInSeconds() {
    // update timeStamp
    this.update();
    return Timer.toSeconds(this._current);
  }

  // playback
  start() {
    // do we need to change
    if (this.state === 'start') return;

    // update start time if needed
    if (!this._startedAt) {
      this._startedAt = new Date().getTime();
    }

    // check if there is paused time
    if (this._pausedInterval) {
      this._pausedTotal += this._pausedInterval;
      this._pausedInterval = null;
    }

    // change state
    this.state = 'start';
  }
  pause() {
    // do we need to change
    if (this.state === 'pause') return;

    // update pause time
    this._pausedAt = new Date().getTime();

    // change state
    this.state = 'pause';
  }
  stop() {
    console.log('stop: not yet implemented');
    return false;
  }
  roll() {
    console.log('roll: not yet implemented');
    return false;
  }
}

module.exports = Timer;
