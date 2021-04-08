class Timer {
  #current = null;
  #finishAt = null;
  #startedAt = null;
  #pausedAt = null;
  #pausedInterval = null;
  #pausedTotal = null;
  state = 'pause';

  constructor() {}

  // call setup separately
  setupWithSeconds(seconds, autoStart = false) {
    // aux
    const now = new Date().getTime();

    // populate targets
    this.#finishAt = now + seconds * 1000;

    // start counting
    this.#startedAt = now;

    if (autoStart) {
      this.state = 'start';
    } else {
      this.#pausedAt = now;
      this.#pausedInterval = 0;
    }
    this.#pausedTotal = 0;
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
        this.#current = this.#finishAt + this.#pausedTotal - now;
        break;
      case 'pause':
        // update paused time
        this.#pausedInterval = now - this.#pausedAt;
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

  #getExpectedFinish() {
    return (
      this.#finishAt +
      (this.#pausedInterval + this.#pausedTotal)
    );
  }

  // getObject
  getObject() {
    this.update();
    return {
      currentSeconds: Timer.toSeconds(this.#current),
      expectedFinish: this.#getExpectedFinish(),
      startedAt: this.#startedAt,
    };
  }

  // current time in seconds
  getCurrentInSeconds() {
    // update timeStamp
    this.update();
    return Timer.toSeconds(this.#current);
  }

  // playback
  start() {
    // do we need to change
    if (this.state === 'start') return;

    // update start time if needed
    if (!this.#startedAt) {
      this.#startedAt = new Date().getTime();
    }

    // check if there is paused time
    if (this.#pausedInterval) {
      this.#pausedTotal += this.#pausedInterval;
      this.#pausedInterval = null;
    }

    // change state
    this.state = 'start';
    console.log('started');
  }
  pause() {
    // do we need to change
    if (this.state === 'pause') return;

    // update pause time
    this.#pausedAt = new Date().getTime();

    // change state
    this.state = 'pause';

    console.log('paused');
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
