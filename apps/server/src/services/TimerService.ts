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
  private _interval: NodeJS.Timer;
  private _updateInterval: number;
  private _refreshInterval: number;

  /**
   * @constructor
   * @param {object} [timerConfig]
   * @param {number} [timerConfig.refresh]
   * @param {number} [timerConfig.updateInterval]
   */
  constructor(timerConfig: { refresh: number; updateInterval: number }) {
    this._refreshInterval = timerConfig.refresh;
    this._updateInterval = timerConfig.updateInterval;
    logger.info(LogOrigin.Server, 'Timer service started');
  }

  init() {
    this._interval = setInterval(() => this.update(), this._refreshInterval);
  }

  /**
   * Resumes a given playback state, same as load
   * @param {RestorePoint} restorePoint
   * @param {OntimeEvent} event
   */
  resume(event: OntimeEvent, restorePoint: RestorePoint) {
    stateMutations.timer.resume(event, restorePoint);
  }

  // TODO: can load and hotreload be merged?
  /**
   * Reloads information for currently running timer
   * @param event
   */
  hotReload(event: OntimeEvent | undefined) {
    if (event === undefined) {
      this.stop();
      return;
    }

    // TODO: this is no longer correct
    if (event.id !== state.timer.selectedEventId) {
      // we only hot reload if the timer is the same
      return;
    }

    if (event.skip) {
      this.stop();
    }

    // TODO: check if any relevant information warrants update
    stateMutations.timer.reload(event);

    this.update(true);
  }

  /**
   * Loads given timer to object
   * @param {OntimeEvent} event
   * @param {initialLoadingData} initialData
   */
  load(event: OntimeEvent, initialData?: initialLoadingData) {
    if (event.skip) {
      throw new Error('Refuse load of skipped event');
    }

    stateMutations.timer.clear();

    // TODO: does this replace the need for hot reload?
    if (initialData) {
      stateMutations.timer.patch(initialData);
    }

    stateMutations.timer.load(event);
  }

  start() {
    if (!state.timer.selectedEventId) {
      // TODO: we should be able to start
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
    if (state.playback !== Playback.Play) {
      return;
    }
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
    if (amount === 0) {
      return;
    }
    if (state.timer.selectedEventId === null) {
      return;
    }
    stateMutations.timer.addTime(amount);
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
    stateMutations.timer.roll(currentEvent, nextEvent);
    this.update();
  }

  shutdown() {
    clearInterval(this._interval);
  }
}

// calculate at 30fps, refresh at 1fps
export const eventTimer = new TimerService({ refresh: 32, updateInterval: 1000 });
