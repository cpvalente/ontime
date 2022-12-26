import { runtimeState } from '../stores/EventStore.js';

class TimerService {
  /**
   * @constructor
   * @param {object} [timerConfig]
   * @param {number} [timerConfig.refresh]
   */
  constructor(timerConfig) {
    this._clear();
    this._interval = setInterval(() => this.update(), timerConfig?.refresh || 1000);
  }

  /**
   * Get current time in ms from midnight
   * @static
   * @return {number}
   */
  static getCurrentTime() {
    const now = new Date();

    // extract milliseconds since midnight
    let elapsed = now.getHours() * 3600000;
    elapsed += now.getMinutes() * 60000;
    elapsed += now.getSeconds() * 1000;
    elapsed += now.getMilliseconds();
    return elapsed;
  }

  /**
   * Returns expected time finish
   * @private
   */
  _getExpectedFinish() {
    if (this.timer.startedAt === null) {
      return null;
    }

    if (this.timer.finishedAt) {
      return this.timer.finishedAt;
    }

    return Math.max(
      this.timer.startedAt + this.timer.duration + this._pausedInterval + this.timer.addedTime,
      this.timer.startedAt
    );
  }

  /**
   * Clears internal state
   * @private
   */
  _clear() {
    this.playback = 'stop';
    this.timer = {
      clock: TimerService.getCurrentTime(),
      current: null,
      elapsed: null,
      expectedFinish: null,
      addedTime: 0,
      startedAt: null,
      finishedAt: null,
      secondaryTimer: null,
    };
    this.loadedTimer = null;
    this.loadedTimerId = null;
    this._pausedInterval = 0;
    this._pausedAt = null;
  }

  /**
   * Reloads information for currently running timer
   * @param timer
   */
  hotReload(timer) {
    if (timer.id !== this.loadedTimerId) {
      return;
    }
    if (timer.skip) {
      this.stop();
    }

    // update relevant information and force update
    this.loadedTimer = timer;
    this.timer.duration = timer.duration;
    if (this.timer.startedAt === null) {
      this.timer.current = timer.duration;
    }
    this.update();
  }

  /**
   * Loads given timer to object
   * @param {object} timer
   * @param {number} timer.id
   * @param {number} timer.timeStart
   * @param {number} timer.timeEnd
   * @param {number} timer.duration
   * @param {string} timer.timeType
   * @param {boolean} timer.skip
   */
  load(timer) {
    if (timer.skip) {
      throw new Error('Refuse load of skipped event');
    }

    this._clear();

    this.loadedTimer = timer;
    this.loadedTimerId = timer.id;
    this.timer.duration = timer.duration;
    this.timer.current = timer.duration;
    this.playback = 'armed';
    this._pausedInterval = 0;
    this._pausedAt = 0;

    this._onLoad();
  }

  /**
   * Handles side effects related to onLoad event
   * @private
   */
  _onLoad() {
    runtimeState.set('playback', this.playback);
    runtimeState.set('ontime-timer', this.timer);
  }

  start() {
    if (!this.loadedTimerId) {
      return;
    }

    if (this.playback === 'play') {
      return;
    }

    this.timer.clock = TimerService.getCurrentTime();

    // add paused time
    if (this._pausedInterval) {
      this.timer.addedTime += this._pausedInterval;
      this._pausedAt = null;
      this._pausedInterval = 0;
    } else {
      this.timer.startedAt = this.timer.clock;
    }

    this.playback = 'play';
    this.timer.expectedFinish = this._getExpectedFinish();
    this._onStart();
  }

  /**
   * Handles side effects related to onStart event
   * @private
   */
  _onStart() {
    runtimeState.set('playback', this.playback);
    runtimeState.set('ontime-timer', this.timer);
  }

  pause() {
    if (this.playback !== 'play') {
      return;
    }

    this.playback = 'pause';
    this.timer.clock = TimerService.getCurrentTime();
    this._pausedAt = this.timer.clock;
    this._onPause();
  }

  _onPause() {
    runtimeState.set('playback', this.playback);
    runtimeState.set('ontime-timer', this.timer);
  }

  stop() {
    if (this.playback === 'stop') {
      return;
    }

    this._clear();
    this._onStop();
  }

  _onStop() {
    runtimeState.set('playback', this.playback);
    runtimeState.set('ontime-timer', this.timer);
  }

  /**
   * Delays running timer by given amount
   * @param {number} amount
   */
  delay(amount) {
    if (!this.loadedTimerId) {
      return;
    }

    this.timer.addedTime += amount;
    this.timer.current += amount;
    this.timer.elapsed += amount;

    // handle edge cases
    if (amount < 0 && Math.abs(amount) > this.timer.current) {
      if (this.timer.finishedAt === null) {
        // if we will make the clock negative
        this.timer.finishedAt = TimerService.getCurrentTime();
      }
    } else if (this.timer.current < 0 && this.timer.current + amount > 0) {
      // clock will go from negative to positive
      this.timer.finishedAt = null;
    }

    // force an update
    this.update();
  }

  update() {
    this.timer.clock = TimerService.getCurrentTime();

    // we only update timer if a timer has been started
    if (this.timer.startedAt !== null) {
      if (this.playback === 'pause') {
        this._pausedInterval = this.timer.clock - this._pausedAt;
      }

      this.timer.current =
        this.timer.startedAt +
        this.timer.duration +
        this.timer.addedTime +
        this._pausedInterval -
        this.timer.clock;
      this.timer.elapsed = this.timer.duration - this.timer.current;

      if (this.playback === 'play' && this.timer.current <= 0 && this.timer.finishedAt === null) {
        this.timer.finishedAt = this.timer.clock;
        this._onFinish();
      } else {
        this.timer.finishedAt = null;
      }
      this.timer.expectedFinish = this._getExpectedFinish();
    }
    this._onUpdate();
  }

  _onUpdate() {
    runtimeState.set('playback', this.playback);
    runtimeState.set('ontime-timer', this.timer);
  }

  _onFinish() {
    runtimeState.set('playback', this.playback);
    runtimeState.set('ontime-timer', this.timer);
  }

  roll() {
    this._onRoll();
  }

  _onRoll() {
    throw new Error('Roll not implemented');
  }

  shutdown() {
    clearInterval(this._interval);
  }
}

export const eventTimer = new TimerService();
