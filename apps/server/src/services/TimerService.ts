import { EndAction, LogOrigin, OntimeEvent, Playback, TimerLifeCycle, TimerType } from 'ontime-types';
import { calculateDuration, dayInMs } from 'ontime-utils';

import { eventStore } from '../stores/EventStore.js';
import { PlaybackService } from './PlaybackService.js';
import { updateRoll } from './rollUtils.js';
import { integrationService } from './integration-service/IntegrationService.js';
import { getCurrent, getExpectedFinish } from './timerUtils.js';
import { clock } from './Clock.js';
import { logger } from '../classes/Logger.js';
import type { RestorePoint } from './RestoreService.js';
import { clearTimer, patchTimer, resumeTimer, state } from '../state.js';

type initialLoadingData = {
  startedAt?: number | null;
  expectedFinish?: number | null;
  current?: number | null;
};

type RestoreCallback = (newState: RestorePoint) => Promise<void>;

export class TimerService {
  private readonly _interval: NodeJS.Timer;
  private _updateInterval: number;
  private _lastUpdate: number | null;

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
   */
  constructor(timerConfig: { refresh?: number; updateInterval?: number } = {}) {
    this._clear();
    this._interval = setInterval(() => this.update(), timerConfig?.refresh ?? 1000);
    this._updateInterval = timerConfig?.updateInterval ?? 1000;
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
    clearTimer();

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

    resumeTimer(timer, restorePoint);

    // this is pretty much the same as load, with a few exceptions
    this.loadedTimerId = timer.id;
    this.loadedTimerStart = timer.timeStart;
    this.loadedTimerEnd = timer.timeEnd;

    this.pausedTime = 0;
    this.pausedAt = restorePoint.pausedAt;

    this._onResume();
  }

  _onResume() {
    eventStore.batchSet({
      playback: state.playback,
      timer: state.timer,
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
    state.timer.duration = calculateDuration(timer.timeStart, timer.timeEnd);
    state.timer.timerType = timer.timerType;
    state.timer.endAction = timer.endAction;
    this.loadedTimerStart = timer.timeStart;
    this.loadedTimerEnd = timer.timeEnd;

    // this might not be ideal
    state.timer.finishedAt = null;
    state.timer.expectedFinish = getExpectedFinish(
      state.timer.startedAt,
      state.timer.finishedAt,
      state.timer.duration,
      this.pausedTime,
      state.timer.addedTime,
      this.loadedTimerEnd,
      state.timer.timerType,
    );
    if (state.timer.startedAt === null) {
      state.timer.current = state.timer.duration;
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

    state.timer.duration = calculateDuration(timer.timeStart, timer.timeEnd);
    state.playback = Playback.Armed;
    state.timer.timerType = timer.timerType;
    state.timer.endAction = timer.endAction;
    this.pausedTime = 0;
    this.pausedAt = 0;

    state.timer.current = state.timer.duration;
    if (state.timer.timerType === TimerType.TimeToEnd) {
      const now = clock.timeNow();
      state.timer.current = getCurrent(now, state.timer.duration, 0, 0, now, timer.timeEnd, state.timer.timerType);
    }

    if (initialData) {
      patchTimer(initialData);
    }

    this._onLoad();
  }

  /**
   * Handles side effects related to onLoad event
   * @private
   */
  _onLoad() {
    eventStore.batchSet({
      playback: state.playback,
      timer: state.timer,
    });
    integrationService.dispatch(TimerLifeCycle.onLoad);
    this._saveState();
  }

  start() {
    if (!this.loadedTimerId) {
      if (state.playback === Playback.Roll) {
        logger.error(LogOrigin.Playback, 'Cannot start while waiting for event');
      }
      return;
    }

    if (state.playback === Playback.Play) {
      return;
    }

    state.timer.clock = clock.timeNow();
    state.timer.secondaryTimer = null;
    this.secondaryTarget = null;

    // add paused time if it exists
    if (this.pausedTime) {
      state.timer.addedTime += this.pausedTime;
      this.pausedAt = null;
      this.pausedTime = 0;
    } else if (state.timer.startedAt === null) {
      state.timer.startedAt = state.timer.clock;
    }

    state.playback = Playback.Play;
    state.timer.expectedFinish = getExpectedFinish(
      state.timer.startedAt,
      state.timer.finishedAt,
      state.timer.duration,
      this.pausedTime,
      state.timer.addedTime,
      this.loadedTimerEnd,
      state.timer.timerType,
    );
    this._onStart();
  }

  /**
   * Handles side effects related to onStart event
   * @private
   */
  _onStart() {
    eventStore.batchSet({
      playback: state.playback,
      timer: state.timer,
    });
    integrationService.dispatch(TimerLifeCycle.onStart);
    this._saveState();
  }

  pause() {
    state.playback = Playback.Pause;
    state.timer.clock = clock.timeNow();
    this.pausedAt = state.timer.clock;
    this._onPause();
  }

  _onPause() {
    eventStore.batchSet({
      playback: state.playback,
      timer: state.timer,
    });
    integrationService.dispatch(TimerLifeCycle.onPause);
    this._saveState();
  }

  stop() {
    if (state.playback === Playback.Stop) {
      return;
    }

    this._clear();
    this._onStop();
  }

  _onStop() {
    eventStore.batchSet({
      playback: state.playback,
      timer: state.timer,
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

    state.timer.addedTime += amount;

    // handle edge cases
    if (amount < 0 && Math.abs(amount) > state.timer.current) {
      if (state.timer.finishedAt === null) {
        // if we will make the clock negative
        state.timer.finishedAt = clock.timeNow();
      }
    } else if (state.timer.current < 0 && state.timer.current + amount > 0) {
      // clock will go from negative to positive
      state.timer.finishedAt = null;
    }

    // force an update
    this.update(true);
    this._saveState();
  }

  private updateRoll() {
    const tempCurrentTimer = {
      selectedEventId: this.loadedTimerId,
      current: state.timer.current,
      // safeguard on midnight rollover
      _finishAt:
        state.timer.expectedFinish >= state.timer.startedAt
          ? state.timer.expectedFinish
          : state.timer.expectedFinish + dayInMs,

      clock: state.timer.clock,
      secondaryTimer: state.timer.secondaryTimer,
      secondaryTarget: this.secondaryTarget,
    };
    const { updatedTimer, updatedSecondaryTimer, doRollLoad, isFinished } = updateRoll(tempCurrentTimer);

    state.timer.current = updatedTimer;
    state.timer.secondaryTimer = updatedSecondaryTimer;
    state.timer.elapsed = state.timer.duration - state.timer.current;

    if (isFinished) {
      state.timer.selectedEventId = null;
      this.loadedTimerId = null;
      this._onFinish();
    }

    // to load the next event we have to escalate to parent service
    if (doRollLoad) {
      PlaybackService.roll();
    }
  }

  private updatePlay() {
    if (state.playback === Playback.Pause) {
      this.pausedTime = state.timer.clock - this.pausedAt;
    }

    if (state.playback === Playback.Play && state.timer.finishedNow) {
      state.timer.finishedAt = state.timer.clock;
      this._onFinish();
    } else {
      state.timer.expectedFinish = getExpectedFinish(
        state.timer.startedAt,
        state.timer.finishedAt,
        state.timer.duration,
        this.pausedTime,
        state.timer.addedTime,
        this.loadedTimerEnd,
        state.timer.timerType,
      );
    }
    state.timer.current = getCurrent(
      state.timer.startedAt,
      state.timer.duration,
      state.timer.addedTime,
      this.pausedTime,
      state.timer.clock,
      this.loadedTimerEnd,
      state.timer.timerType,
    );
    state.timer.elapsed = state.timer.duration - state.timer.current;
  }

  update(force = false) {
    const previousTime = state.timer.clock;
    state.timer.clock = clock.timeNow();
    if (previousTime > state.timer.clock) {
      force = true;
    }

    // we call integrations if we update timers
    let shouldNotify = false;
    if (state.playback === Playback.Roll) {
      shouldNotify = true;
      this.updateRoll();
    } else if (state.timer.startedAt !== null) {
      // we only update timer if a timer has been started
      shouldNotify = true;
      this.updatePlay();
    }

    // we only update the store at the updateInterval
    // side effects such as onFinish will still be triggered in the update functions
    if (force || state.timer.clock > this._lastUpdate + this._updateInterval) {
      this._lastUpdate = state.timer.clock;
      this._onUpdate(shouldNotify);
    }
  }

  _onUpdate(shouldNotify: boolean) {
    eventStore.set('timer', state.timer);
    if (shouldNotify) {
      integrationService.dispatch(TimerLifeCycle.onUpdate);
    }
  }

  _onFinish() {
    eventStore.set('timer', state.timer);
    integrationService.dispatch(TimerLifeCycle.onFinish);
    if (state.playback === Playback.Play) {
      if (state.timer.endAction === EndAction.Stop) {
        PlaybackService.stop();
      } else if (state.timer.endAction === EndAction.LoadNext) {
        // we need to delay here to put this action in the queue stack. otherwise it won't be executed properly
        setTimeout(() => {
          PlaybackService.loadNext();
        }, 0);
      } else if (state.timer.endAction === EndAction.PlayNext) {
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
    state.timer.clock = clock.timeNow();

    if (currentEvent) {
      // there is something running, load
      state.timer.secondaryTimer = null;
      this.secondaryTarget = null;

      // account for event that finishes the day after
      const endTime =
        currentEvent.timeEnd < currentEvent.timeStart ? currentEvent.timeEnd + dayInMs : currentEvent.timeEnd;

      // when we load a timer in roll, we do the same things as before
      // but also pre-populate some data as to the running state
      this.load(currentEvent, {
        startedAt: currentEvent.timeStart,
        expectedFinish: currentEvent.timeEnd,
        current: endTime - state.timer.clock,
      });
    } else if (nextEvent) {
      // account for day after
      const nextStart = nextEvent.timeStart < state.timer.clock ? nextEvent.timeStart + dayInMs : nextEvent.timeStart;
      // nothing now, but something coming up
      state.timer.secondaryTimer = nextStart - state.timer.clock;
      this.secondaryTarget = nextStart;
    }
    state.playback = Playback.Roll;
    this._onRoll();
    this.update(true);
  }

  _onRoll() {
    eventStore.set('playback', state.playback);
    this._saveState();
  }

  async _saveState() {
    if (this.saveRestorePoint) {
      await this.saveRestorePoint({
        playback: state.playback,
        selectedEventId: this.loadedTimerId,
        startedAt: state.timer.startedAt,
        addedTime: state.timer.addedTime,
        pausedAt: this.pausedAt,
      });
    }
  }

  shutdown() {
    clearInterval(this._interval);
  }
}

// calculate at 30fps, refresh at 1fps
export const eventTimer = new TimerService({ refresh: 32, updateInterval: 1000 });
