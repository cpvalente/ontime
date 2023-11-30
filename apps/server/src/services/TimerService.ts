import { EndAction, LogOrigin, OntimeEvent, Playback, TimerLifeCycle, TimerState, TimerType } from 'ontime-types';
import { calculateDuration, dayInMs } from 'ontime-utils';

import { eventStore } from '../stores/EventStore.js';
import { PlaybackService } from './PlaybackService.js';
import { updateRoll } from './rollUtils.js';
import { integrationService } from './integration-service/IntegrationService.js';
import { getCurrent, getExpectedFinish, skippedOutOfEvent } from './timerUtils.js';
import { clock } from './Clock.js';
import { logger } from '../classes/Logger.js';
import type { RestorePoint } from './RestoreService.js';

type initialLoadingData = {
  startedAt?: number | null;
  expectedFinish?: number | null;
  current?: number | null;
};

type RestoreCallback = (newState: RestorePoint) => Promise<void>;

export const timeSkipLimit = 3 * 32;

export class TimerService {
  private readonly _interval: NodeJS.Timer;
  private _updateInterval: number;
  private _lastUpdate: number | null;
  private _skipThreshold: number;

  playback: Playback;
  timer: TimerState;

  loadedTimerId: string | null;
  private loadedTimerStart: number | null;
  private loadedTimerEnd: number | null;

  private pausedTime: number;
  private pausedAt: number | null;
  private secondaryTarget: number | null;

  private saveRestorePoint: RestoreCallback;
  /**
   * @constructor
   * @param {object} [timerConfig]
   * @param {number} [timerConfig.refresh]
   * @param {number} [timerConfig.updateInterval]
   * @param {number} [timerConfig.skipThreshold]
   */
  constructor(timerConfig: { refresh: number; updateInterval: number; skipThreshold: number }) {
    this._clear();
    this._interval = setInterval(() => this.update(), timerConfig.refresh);
    this._updateInterval = timerConfig.updateInterval;
    this._skipThreshold = timerConfig.skipThreshold;
  }

  /**
   * Provides callback to save restore point
   * @param cb
   */
  setRestoreCallback(cb: RestoreCallback) {
    this.saveRestorePoint = cb;
  }

  /**
   * Clears internal state
   * @private
   */
  _clear() {
    this.playback = Playback.Stop;
    this.timer = {
      clock: clock.timeNow(),
      current: null,
      elapsed: null,
      expectedFinish: null,
      addedTime: 0,
      startedAt: null,
      finishedAt: null,
      secondaryTimer: null,
      selectedEventId: null,
      duration: null,
      timerType: null,
      endAction: null,
    };
    this.loadedTimerId = null;
    this.loadedTimerStart = null;
    this.loadedTimerEnd = null;

    this.pausedTime = 0;
    this.pausedAt = null;
    this.secondaryTarget = null;

    this._lastUpdate = null;
  }

  /**
   * Resumes a given playback state, same as load
   * @param {RestorePoint} restorePoint
   * @param {OntimeEvent} timer
   */
  resume(timer: OntimeEvent, restorePoint: RestorePoint) {
    this._clear();

    // this is pretty much the same as load, with a few exceptions
    this.loadedTimerId = timer.id;
    this.loadedTimerStart = timer.timeStart;
    this.loadedTimerEnd = timer.timeEnd;

    this.timer.duration = calculateDuration(timer.timeStart, timer.timeEnd);
    this.playback = restorePoint.playback;
    this.timer.timerType = timer.timerType;
    this.timer.endAction = timer.endAction;
    this.timer.startedAt = restorePoint.startedAt;
    this.timer.addedTime = restorePoint.addedTime;
    this.pausedTime = 0;
    this.pausedAt = restorePoint.pausedAt;

    this.timer.current = this.timer.duration;
    if (this.timer.timerType === TimerType.TimeToEnd) {
      const now = clock.timeNow();
      this.timer.current = getCurrent(now, this.timer.duration, 0, 0, now, timer.timeEnd, this.timer.timerType);
    }

    this._onResume();
  }

  _onResume() {
    eventStore.batchSet({
      playback: this.playback,
      timer: this.timer,
    });
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
    this.timer.duration = calculateDuration(timer.timeStart, timer.timeEnd);
    this.timer.timerType = timer.timerType;
    this.timer.endAction = timer.endAction;
    this.loadedTimerStart = timer.timeStart;
    this.loadedTimerEnd = timer.timeEnd;

    // this might not be ideal
    this.timer.finishedAt = null;
    this.timer.expectedFinish = getExpectedFinish(
      this.timer.startedAt,
      this.timer.finishedAt,
      this.timer.duration,
      this.pausedTime,
      this.timer.addedTime,
      this.loadedTimerEnd,
      this.timer.timerType,
    );
    if (this.timer.startedAt === null) {
      this.timer.current = this.timer.duration;
    }
    this.update(true);
  }

  /**
   * Loads given timer to object
   * @param {OntimeEvent} timer
   * @param {initialLoadingData} initialData
   */
  load(timer: OntimeEvent, initialData?: initialLoadingData) {
    if (timer.skip) {
      throw new Error('Refuse load of skipped event');
    }

    this._clear();

    this.loadedTimerId = timer.id;
    this.loadedTimerStart = timer.timeStart;
    this.loadedTimerEnd = timer.timeEnd;

    this.timer.duration = calculateDuration(timer.timeStart, timer.timeEnd);
    this.playback = Playback.Armed;
    this.timer.timerType = timer.timerType;
    this.timer.endAction = timer.endAction;
    this.pausedTime = 0;
    this.pausedAt = 0;

    this.timer.current = this.timer.duration;
    if (this.timer.timerType === TimerType.TimeToEnd) {
      const now = clock.timeNow();
      this.timer.current = getCurrent(now, this.timer.duration, 0, 0, now, timer.timeEnd, this.timer.timerType);
    }

    if (initialData) {
      this.timer = { ...this.timer, ...initialData };
    }

    this._onLoad();
  }

  /**
   * Handles side effects related to onLoad event
   * @private
   */
  _onLoad() {
    eventStore.batchSet({
      playback: this.playback,
      timer: this.timer,
    });
    integrationService.dispatch(TimerLifeCycle.onLoad);
    this._saveState();
  }

  start() {
    if (!this.loadedTimerId) {
      if (this.playback === Playback.Roll) {
        logger.error(LogOrigin.Playback, 'Cannot start while waiting for event');
      }
      return;
    }

    if (this.playback === Playback.Play) {
      return;
    }

    this.timer.clock = clock.timeNow();
    this.timer.secondaryTimer = null;
    this.secondaryTarget = null;

    // add paused time if it exists
    if (this.pausedTime) {
      this.timer.addedTime += this.pausedTime;
      this.pausedAt = null;
      this.pausedTime = 0;
    } else if (this.timer.startedAt === null) {
      this.timer.startedAt = this.timer.clock;
    }

    this.playback = Playback.Play;
    this.timer.expectedFinish = getExpectedFinish(
      this.timer.startedAt,
      this.timer.finishedAt,
      this.timer.duration,
      this.pausedTime,
      this.timer.addedTime,
      this.loadedTimerEnd,
      this.timer.timerType,
    );
    this._onStart();
  }

  /**
   * Handles side effects related to onStart event
   * @private
   */
  _onStart() {
    eventStore.batchSet({
      playback: this.playback,
      timer: this.timer,
    });
    integrationService.dispatch(TimerLifeCycle.onStart);
    this._saveState();
  }

  pause() {
    this.playback = Playback.Pause;
    this.timer.clock = clock.timeNow();
    this.pausedAt = this.timer.clock;
    this._onPause();
  }

  _onPause() {
    eventStore.batchSet({
      playback: this.playback,
      timer: this.timer,
    });
    integrationService.dispatch(TimerLifeCycle.onPause);
    this._saveState();
  }

  stop() {
    if (this.playback === Playback.Stop) {
      return;
    }

    this._clear();
    this._onStop();
  }

  _onStop() {
    eventStore.batchSet({
      playback: this.playback,
      timer: this.timer,
    });
    integrationService.dispatch(TimerLifeCycle.onStop);
    this._saveState();
  }

  /**
   * Adds time to running timer by given amount
   * @param {number} amount
   */
  addTime(amount: number) {
    if (!this.loadedTimerId) {
      return;
    }

    this.timer.addedTime += amount;

    // handle edge cases
    if (amount < 0 && Math.abs(amount) > this.timer.current) {
      if (this.timer.finishedAt === null) {
        // if we will make the clock negative
        this.timer.finishedAt = clock.timeNow();
      }
    } else if (this.timer.current < 0 && this.timer.current + amount > 0) {
      // clock will go from negative to positive
      this.timer.finishedAt = null;
    }

    // force an update
    this.update(true);
    this._saveState();
  }

  private updateRoll() {
    const tempCurrentTimer = {
      selectedEventId: this.loadedTimerId,
      current: this.timer.current,
      // safeguard on midnight rollover
      _finishAt:
        this.timer.expectedFinish >= this.timer.startedAt
          ? this.timer.expectedFinish
          : this.timer.expectedFinish + dayInMs,
      clock: this.timer.clock,
      secondaryTimer: this.timer.secondaryTimer,
      secondaryTarget: this.secondaryTarget,
    };
    const { updatedTimer, updatedSecondaryTimer, doRollLoad, isFinished } = updateRoll(tempCurrentTimer);

    this.timer.current = updatedTimer;
    this.timer.secondaryTimer = updatedSecondaryTimer;
    this.timer.elapsed = this.timer.duration - this.timer.current;

    if (isFinished) {
      this.timer.selectedEventId = null;
      this.loadedTimerId = null;
      this._onFinish();
    }

    // to load the next event we have to escalate to parent service
    if (doRollLoad) {
      PlaybackService.roll();
    }
  }

  private updatePlay() {
    if (this.playback === Playback.Pause) {
      this.pausedTime = this.timer.clock - this.pausedAt;
    }

    const finishedNow = this.timer.current <= 0 && this.timer.finishedAt === null;
    if (this.playback === Playback.Play && finishedNow) {
      this.timer.finishedAt = this.timer.clock;
      this._onFinish();
    } else {
      this.timer.expectedFinish = getExpectedFinish(
        this.timer.startedAt,
        this.timer.finishedAt,
        this.timer.duration,
        this.pausedTime,
        this.timer.addedTime,
        this.loadedTimerEnd,
        this.timer.timerType,
      );
    }
    this.timer.current = getCurrent(
      this.timer.startedAt,
      this.timer.duration,
      this.timer.addedTime,
      this.pausedTime,
      this.timer.clock,
      this.loadedTimerEnd,
      this.timer.timerType,
    );
    this.timer.elapsed = this.timer.duration - this.timer.current;
  }

  update(force = false) {
    const previousTime = this.timer.clock;
    this.timer.clock = clock.timeNow();
    if (previousTime > this.timer.clock) {
      force = true;
    }

    // we call integrations if we update timers
    let shouldNotify = false;
    if (this.playback === Playback.Roll) {
      shouldNotify = true;
      if (
        skippedOutOfEvent(
          previousTime,
          this.timer.clock,
          this.timer.startedAt,
          this.timer.expectedFinish,
          this._skipThreshold,
        )
      ) {
        PlaybackService.roll();
      } else {
        this.updateRoll();
      }
    } else if (this.timer.startedAt !== null) {
      // we only update timer if a timer has been started
      shouldNotify = true;
      this.updatePlay();
    }

    // we only update the store at the updateInterval
    // side effects such as onFinish will still be triggered in the update functions
    if (force || this.timer.clock > this._lastUpdate + this._updateInterval) {
      this._lastUpdate = this.timer.clock;
      this._onUpdate(shouldNotify);
    }
  }

  _onUpdate(shouldNotify: boolean) {
    eventStore.set('timer', this.timer);
    if (shouldNotify) {
      integrationService.dispatch(TimerLifeCycle.onUpdate);
    }
  }

  _onFinish() {
    eventStore.set('timer', this.timer);
    integrationService.dispatch(TimerLifeCycle.onFinish);
    if (this.playback === Playback.Play) {
      if (this.timer.endAction === EndAction.Stop) {
        PlaybackService.stop();
      } else if (this.timer.endAction === EndAction.LoadNext) {
        // we need to delay here to put this action in the queue stack. otherwise it won't be executed properly
        setTimeout(() => {
          PlaybackService.loadNext();
        }, 0);
      } else if (this.timer.endAction === EndAction.PlayNext) {
        PlaybackService.startNext();
      }
    }
    this._saveState();
  }

  /**
   * Loads roll information into timer service
   * @param {OntimeEvent | null} currentEvent -- both current event and next event cant be null
   * @param {OntimeEvent | null} nextEvent -- both current event and next event cant be null
   */
  roll(currentEvent: OntimeEvent | null, nextEvent: OntimeEvent | null) {
    this._clear();
    this.timer.clock = clock.timeNow();

    if (currentEvent) {
      // there is something running, load
      this.timer.secondaryTimer = null;
      this.secondaryTarget = null;

      // account for event that finishes the day after
      const endTime =
        currentEvent.timeEnd < currentEvent.timeStart ? currentEvent.timeEnd + dayInMs : currentEvent.timeEnd;

      // when we load a timer in roll, we do the same things as before
      // but also pre-populate some data as to the running state
      this.load(currentEvent, {
        startedAt: currentEvent.timeStart,
        expectedFinish: currentEvent.timeEnd,
        current: endTime - this.timer.clock,
      });
    } else if (nextEvent) {
      // account for day after
      const nextStart = nextEvent.timeStart < this.timer.clock ? nextEvent.timeStart + dayInMs : nextEvent.timeStart;
      // nothing now, but something coming up
      this.timer.secondaryTimer = nextStart - this.timer.clock;
      this.secondaryTarget = nextStart;
    }
    this.playback = Playback.Roll;
    this._onRoll();
    this.update(true);
  }

  _onRoll() {
    eventStore.set('playback', this.playback);
    this._saveState();
  }

  async _saveState() {
    if (this.saveRestorePoint) {
      await this.saveRestorePoint({
        playback: this.playback,
        selectedEventId: this.loadedTimerId,
        startedAt: this.timer.startedAt,
        addedTime: this.timer.addedTime,
        pausedAt: this.pausedAt,
      });
    }
  }

  shutdown() {
    clearInterval(this._interval);
  }
}

// calculate at 30fps, refresh at 1fps
// we consider a skip at 3 lost updates
export const eventTimer = new TimerService({ refresh: 32, updateInterval: 1000, skipThreshold: 32 * 3 });
