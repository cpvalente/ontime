import { LogOrigin, OntimeEvent, Playback } from 'ontime-types';

import { logger } from '../classes/Logger.js';
import type { RestorePoint } from './RestoreService.js';
import { stateMutations, state } from '../state.js';

type initialLoadingData = {
  startedAt?: number | null;
  expectedFinish?: number | null;
  current?: number | null;
};

export class TimerService {
  private readonly _interval: NodeJS.Timer;
  private _updateInterval: number;

  /**
   * @constructor
   * @param {object} [timerConfig]
   * @param {number} [timerConfig.refresh]
   * @param {number} [timerConfig.updateInterval]
   */
  constructor(timerConfig: { refresh: number; updateInterval: number }) {
    stateMutations.timer.stop();
    this._interval = setInterval(() => this.update(), timerConfig.refresh);
    this._updateInterval = timerConfig.updateInterval;
  }

  /**
   * Resumes a given playback state, same as load
   * @param {RestorePoint} restorePoint
   * @param {OntimeEvent} timer
   */
  resume(timer: OntimeEvent, restorePoint: RestorePoint) {
    stateMutations.timer.stop();
    stateMutations.timer.resume(timer, restorePoint);
  }

  /**
   * Reloads information for currently running timer
   * @param timer
   */
  hotReload(timer: OntimeEvent | undefined) {
    if (typeof timer === 'undefined') {
      this.stop();
      return;
    }

    if (timer.id !== state.timer.selectedEventId) {
      // event timer only concerns itself with current event
      return;
    }

    if (timer.skip) {
      this.stop();
    }

    // TODO: check if any relevant information warrants update

    stateMutations.timer.reload(timer);

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

    stateMutations.timer.stop();

    if (initialData) {
      stateMutations.timer.patch(initialData);
    }

    stateMutations.timer.load(timer);
  }

  start() {
    if (!state.timer.selectedEventId) {
      if (state.playback === Playback.Roll) {
        logger.error(LogOrigin.Playback, 'Cannot start while waiting for event');
      }

      return;
    }

    if (state.playback === Playback.Play) {
      return;
    }

    stateMutations.timer.start();
  }

  pause() {
    stateMutations.timer.pause();
  }

  stop() {
    if (state.playback === Playback.Stop) {
      return;
    }

    stateMutations.timer.stop();
  }

  /**
   * Adds time to running timer by given amount
   * @param {number} amount
   */
  addTime(amount: number) {
    stateMutations.timer.addTime(amount);

    this.update(true);
  }

  update(force = false) {
    stateMutations.timer.update(force, this._updateInterval);
  }

  /**
   * Loads roll information into timer service
   * @param {OntimeEvent | null} currentEvent -- both current event and next event cant be null
   * @param {OntimeEvent | null} nextEvent -- both current event and next event cant be null
   */
  roll(currentEvent: OntimeEvent | null, nextEvent: OntimeEvent | null) {
    stateMutations.timer.stop();
    stateMutations.timer.roll(currentEvent, nextEvent);
    this.update(true);
  }

  shutdown() {
    clearInterval(this._interval);
  }
}

// calculate at 30fps, refresh at 1fps
export const eventTimer = new TimerService({ refresh: 32, updateInterval: 1000 });
