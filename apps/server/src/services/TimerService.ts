import { TimerLifeCycle } from 'ontime-types';

import { runtimeState } from '../stores/EventStore.js';
import { PlaybackService } from './PlaybackService.js';
import { updateRoll } from './rollUtils.js';
import { DAY_TO_MS } from '../utils/time.js';
import { integrationService } from './integration-service/IntegrationService.js';

export class TimerService {
  private readonly _interval: NodeJS.Timer;

  playback: string;

  loadedTimerId: null;
  private _pausedInterval: number;
  private _pausedAt: number | null;
  private _secondaryTarget: number | null;

  timer: {
    clock: number;
    current: number | null;
    elapsed: number | null;
    expectedFinish: number | null;
    addedTime: number;
    startedAt: number | null;
    finishedAt: number | null;
    secondaryTimer: number | null;
    selectedEventId: string | null;
    duration: number | null;
  };

  /**
   * @constructor
   * @param {object} [timerConfig]
   * @param {number} [timerConfig.refresh]
   */
  constructor(timerConfig?) {
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
      this.timer.startedAt,
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
      selectedEventId: null,
      duration: null,
    };
    this.loadedTimerId = null;
    this._pausedInterval = 0;
    this._pausedAt = null;
    this._secondaryTarget = null;
  }

  /**
   * Reloads information for currently running timer
   * @param timer
   */
  hotReload(timer) {
    if (typeof timer === 'undefined') {
      this.stop();
      return;
    }

    if (timer?.id !== this.loadedTimerId) {
      // event timer only concerns itself with current event
      return;
    }

    if (timer?.skip) {
      this.stop();
    }

    // TODO: check if any relevant information warrants update

    // update relevant information and force update
    this.timer.duration = timer.duration;

    // this might not be ideal
    this.timer.finishedAt = null;
    this.timer.expectedFinish = this._getExpectedFinish();
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
    integrationService.dispatch(TimerLifeCycle.onLoad);
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
    integrationService.dispatch(TimerLifeCycle.onStart);
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
    integrationService.dispatch(TimerLifeCycle.onPause);
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
    integrationService.dispatch(TimerLifeCycle.onStop);
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

    if (this.playback === 'roll') {
      const tempCurrentTimer = {
        selectedEventId: this.loadedTimerId,
        current: this.timer.current,
        // safeguard on midnight rollover
        _finishAt:
          this.timer.expectedFinish >= this.timer.startedAt
            ? this.timer.expectedFinish
            : this.timer.expectedFinish + DAY_TO_MS,

        clock: this.timer.clock,
        secondaryTimer: this.timer.secondaryTimer,
        _secondaryTarget: this._secondaryTarget,
      };
      const { updatedTimer, updatedSecondaryTimer, doRollLoad, isFinished } = updateRoll(tempCurrentTimer);

      this.timer.current = updatedTimer;
      this.timer.secondaryTimer = updatedSecondaryTimer;

      if (isFinished) {
        this.timer.selectedEventId = null;
        this.loadedTimerId = null;
        this._onFinish();
      }

      if (doRollLoad) {
        PlaybackService.roll();
      }
    } else {
      // we only update timer if a timer has been started
      if (this.timer.startedAt !== null) {
        if (this.playback === 'pause') {
          this._pausedInterval = this.timer.clock - this._pausedAt;
        }

        this.timer.current =
          this.timer.startedAt + this.timer.duration + this.timer.addedTime + this._pausedInterval - this.timer.clock;
        this.timer.elapsed = this.timer.duration - this.timer.current;

        if (this.playback === 'play' && this.timer.current <= 0 && this.timer.finishedAt === null) {
          this.timer.finishedAt = this.timer.clock;
          this._onFinish();
        } else {
          this.timer.finishedAt = null;
        }
        this.timer.expectedFinish = this._getExpectedFinish();
      }
    }
    this._onUpdate();
  }

  _onUpdate() {
    runtimeState.set('playback', this.playback);
    runtimeState.set('ontime-timer', this.timer);
    integrationService.dispatch(TimerLifeCycle.onUpdate);
  }

  _onFinish() {
    runtimeState.set('playback', this.playback);
    runtimeState.set('ontime-timer', this.timer);
    integrationService.dispatch(TimerLifeCycle.onFinish);
  }

  roll(currentEvent, nextEvent, timers) {
    this._clear();
    this.timer.clock = TimerService.getCurrentTime();

    if (currentEvent) {
      // there is something running, load
      this.timer.secondaryTimer = null;
      this._secondaryTarget = null;

      this.loadedTimerId = currentEvent.id;
      this.timer.startedAt = currentEvent.timeStart;
      this.timer.expectedFinish = currentEvent.timeEnd;
      this.timer.duration = timers.duration;
      this.timer.current = timers.current;
    } else if (nextEvent) {
      // nothing now, but something coming up
      this.timer.secondaryTimer = nextEvent.timeStart - this.timer.clock;
      this._secondaryTarget = nextEvent.timeStart;
    }

    this.playback = 'roll';
    this._onRoll();
    this.update();
  }

  _onRoll() {
    this._onLoad();
  }

  shutdown() {
    clearInterval(this._interval);
  }
}

export const eventTimer = new TimerService();
