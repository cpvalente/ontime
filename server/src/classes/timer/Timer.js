import { stringFromMillis } from '../../utils/time.js';

/**
 * @description Implements simple countdown timer functions
 * @class
 */
export class Timer {
  constructor() {
    this.clock = null;
    this._resetTimers(true);
    this.state = 'stop';
  }

  /**
   * @description initiates a timer with given seconds
   * @param seconds
   * @param autoStart
   */
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

  /**
   * @description updates the running timer
   */
  update() {
    // get current time
    const now = this._getCurrentTime();
    this.clock = now;
    let checkFinish = false;

    // check playstate
    switch (this.state) {
      case 'start':
        // ensure we have a start time
        if (this._startedAt == null) this._startedAt = now;

        // update current timer
        this.current = this._startedAt + this.duration + this._pausedTotal - now;

        // enable flag
        checkFinish = true;
        break;
      case 'pause':
        // update paused time
        this._pausedInterval = now - this._pausedAt;

        if (this._startedAt != null) {
          // update current timer
          this.current =
            this._startedAt + this.duration + this._pausedTotal + this._pausedInterval - now;
        }

        // enable flag
        checkFinish = true;
        break;
      case 'stop':
        // nothing here yet
        break;
    }

    if (checkFinish) {
      // is event finished?
      const isTimeOver = this.current <= 0;
      const isUpdating = this.state !== 'pause';

      if (isTimeOver && isUpdating && this._finishedAt == null) {
        if (this._finishedAt === null) this._finishedAt = now;
        this._finishedFlag = true;
      }
    }
    this.timeTag = stringFromMillis(this.current);
  }

  // helpers
  /**
   * @description converts a value in millis to seconds
   * @param millis
   * @return {number}
   */
  static toSeconds(millis) {
    if (millis == null) return 0;
    return millis < 0 ? Math.ceil(millis * 0.001) : Math.floor(millis * 0.001);
  }

  /**
   * @description get current time in epoc
   * @return {number}
   * @private
   */
  _getCurrentTime() {
    const now = new Date();

    // extract milliseconds since midnight
    let elapsed = now.getHours() * 3600000;
    elapsed += now.getMinutes() * 60000;
    elapsed += now.getSeconds() * 1000;
    elapsed += now.getMilliseconds();

    return elapsed;
  }

  /**
   * @description when is timer finishing
   * @return {null|*|null|number}
   * @private
   */
  _getExpectedFinish() {
    if (this._startedAt == null) return null;
    if (this._finishedAt) return this._finishedAt;

    return Math.max(
      this._startedAt + this.duration + this._pausedInterval + this._pausedTotal,
      this._startedAt
    );
  }

  /**
   * @description resets timer parameters
   * @param total
   * @private
   */
  _resetTimers(total = false) {
    if (total) this.duration = null;
    this.current = this.duration;
    this.timeTag = null;
    this.running = null;
    this.secondaryTimer = null;
    this._secondaryTarget = null;
    this._finishAt = null;
    this._finishedAt = null;
    this._finishedFlag = false;
    this._startedAt = null;
    this._pausedAt = null;
    this._pausedInterval = null;
    this._pausedTotal = null;
  }

  /**
   * @description get elapsed time
   * @return {number}
   */
  getElapsed() {
    return this.duration - this.current;
  }

  /**
   * @description Builds time object
   * @returns {{running: number, secondary: number, expectedFinish: number, durationSeconds: number, startedAt: null, clock: null}}
   */
  getTimeObject() {
    return {
      clock: this.clock,
      isNegative: this.current < 0,
      running: Timer.toSeconds(this.current),
      secondary: Timer.toSeconds(this.secondaryTimer),
      durationSeconds: Timer.toSeconds(this.duration),
      expectedFinish: this._getExpectedFinish(),
      startedAt: this._startedAt,
    };
  }

  /**
   * @description get current time in seconds
   * @return {number|number}
   */
  getCurrentInSeconds() {
    // update timeStamp
    this.update();
    return Timer.toSeconds(this.current);
  }

  // playback
  /**
   * @description start current time
   */
  start() {
    // do we need to change
    if (this.state === 'start') return;
    else if (this._startedAt == null) {
      // it hasn't started yet
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

  /**
   * @description pause current timer
   */
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

  /**
   * @description stop current timer
   */
  stop() {
    // do we need to change
    if (this.state === 'stop') return;

    // clear all timers
    this._resetTimers();

    // change state
    this.state = 'stop';
  }

  /**
   * @description increments a given amout to the timer
   * @param amount
   */
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
