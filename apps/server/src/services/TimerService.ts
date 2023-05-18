import { EndAction, OntimeEvent, Playback, TimerLifeCycle, TimerState } from 'ontime-types';

import { eventStore } from '../stores/EventStore.js';
import { PlaybackService } from './PlaybackService.js';
import { updateRoll } from './rollUtils.js';
import { DAY_TO_MS } from '../utils/time.js';
import { integrationService } from './integration-service/IntegrationService.js';
import { getCurrent, getElapsed, getExpectedFinish } from './timerUtils.js';
import { clock } from './Clock.js';

export class TimerService {
  private readonly _interval: NodeJS.Timer;

  playback: Playback;
  timer: TimerState;

  loadedTimerId: string | null;
  private pausedTime: number;
  private pausedAt: number | null;
  private secondaryTarget: number | null;

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
    this.pausedTime = 0;
    this.pausedAt = null;
    this.secondaryTarget = null;
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
    this.timer.timerType = timer.timerType;
    this.timer.endAction = timer.endAction;

    // this might not be ideal
    this.timer.finishedAt = null;
    this.timer.expectedFinish = getExpectedFinish(
      this.timer.startedAt,
      this.timer.finishedAt,
      this.timer.duration,
      this.pausedTime,
      this.timer.addedTime,
    );
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
   * @param {string} timer.timerBehaviour
   * @param {string} timer.timerType
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
    this.playback = Playback.Armed;
    this.timer.timerType = timer.timerType;
    this.timer.endAction = timer.endAction;
    this.pausedTime = 0;
    this.pausedAt = 0;

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
  }

  start() {
    if (!this.loadedTimerId) {
      return;
    }

    if (this.playback === Playback.Play) {
      return;
    }

    this.timer.clock = clock.timeNow();

    // add paused time
    if (this.pausedTime) {
      this.timer.addedTime += this.pausedTime;
      this.pausedAt = null;
      this.pausedTime = 0;
    } else {
      this.timer.startedAt = this.timer.clock;
    }

    this.playback = Playback.Play;
    this.timer.expectedFinish = getExpectedFinish(
      this.timer.startedAt,
      this.timer.finishedAt,
      this.timer.duration,
      this.pausedTime,
      this.timer.addedTime,
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
  }

  pause() {
    if (this.playback !== Playback.Play) {
      return;
    }

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
  }

  /**
   * Delays running timer by given amount
   * @param {number} amount
   */
  delay(amount: number) {
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
    this.update();
  }

  update() {
    this.timer.clock = clock.timeNow();

    if (this.playback === Playback.Roll) {
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
        secondaryTarget: this.secondaryTarget,
      };
      const { updatedTimer, updatedSecondaryTimer, doRollLoad, isFinished } = updateRoll(tempCurrentTimer);

      this.timer.current = updatedTimer;
      this.timer.secondaryTimer = updatedSecondaryTimer;
      this.timer.elapsed = getElapsed(this.timer.startedAt, this.timer.clock);

      if (isFinished) {
        this.timer.selectedEventId = null;
        this.loadedTimerId = null;
        this._onFinish();
      }

      // to load the next event we have to escalate to parent service
      if (doRollLoad) {
        PlaybackService.roll();
      }
    } else {
      // we only update timer if a timer has been started
      if (this.timer.startedAt !== null) {
        if (this.playback === Playback.Pause) {
          this.pausedTime = this.timer.clock - this.pausedAt;
        }

        if (this.playback === Playback.Play && this.timer.current <= 0 && this.timer.finishedAt === null) {
          this.timer.finishedAt = this.timer.clock;
          this._onFinish();
        } else {
          this.timer.expectedFinish = getExpectedFinish(
            this.timer.startedAt,
            this.timer.finishedAt,
            this.timer.duration,
            this.pausedTime,
            this.timer.addedTime,
          );
        }
        this.timer.current = getCurrent(
          this.timer.startedAt,
          this.timer.duration,
          this.timer.addedTime,
          this.pausedTime,
          this.timer.clock,
        );

        this.timer.elapsed = getElapsed(this.timer.startedAt, this.timer.clock);
      }
    }
    this._onUpdate();
  }

  _onUpdate() {
    eventStore.set('timer', this.timer);
    integrationService.dispatch(TimerLifeCycle.onUpdate);
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

      // when we load a timer in roll, we do the same things as before
      // but also pre-populate some data as to the running state
      this.load(currentEvent);
      this.timer.startedAt = currentEvent.timeStart;
      this.timer.expectedFinish = currentEvent.timeEnd;
    } else if (nextEvent) {
      // account for day after
      const nextStart = nextEvent.timeStart < this.timer.clock ? nextEvent.timeStart + DAY_TO_MS : nextEvent.timeStart;
      // nothing now, but something coming up
      this.timer.secondaryTimer = nextStart - this.timer.clock;
      this.secondaryTarget = nextStart;
    }
    this.playback = Playback.Roll;
    this._onRoll();
    this.update();
  }

  _onRoll() {
    eventStore.set('playback', this.playback);
  }

  shutdown() {
    clearInterval(this._interval);
  }
}

export const eventTimer = new TimerService();
