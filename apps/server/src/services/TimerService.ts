import { OntimeEvent } from 'ontime-types';

import * as runtimeState from '../stores/runtimeState.js';
import type { UpdateResult } from '../stores/runtimeState.js';
import { timerConfig } from '../config/config.js';

/**
 * Service manages Ontime's main timer
 */
export class TimerService {
  private readonly _interval: NodeJS.Timer;
  /** how often we recalculate */
  static _refreshInterval: number;

  /** when timer will be finished */
  private endCallback: NodeJS.Timer;

  private onUpdateCallback: (updateResult: UpdateResult) => void;

  /**
   * @constructor
   * @param {number} [timerConfig.refresh] how often we recalculate
   * @param {number} [timerConfig.updateInterval] how often we update the socket
   * @param {function} [timerConfig.onUpdateCallback] how often we update the socket
   */
  constructor(timerConfig: {
    refresh: number;
    updateInterval: number;
    onUpdateCallback: (updateResult: UpdateResult) => void;
  }) {
    TimerService._refreshInterval = timerConfig.refresh;

    this.onUpdateCallback = timerConfig.onUpdateCallback;
    this._interval = setInterval(() => {
      this.update();
    }, TimerService._refreshInterval);
  }

  start() {
    if (!runtimeState.start()) {
      return false;
    }

    const state = runtimeState.getState();
    const endTime = state.timer.current - timerConfig.triggerAhead;
    this.endCallback = setTimeout(() => this.update(), endTime);
    return true;
  }

  pause() {
    if (!runtimeState.pause()) {
      return false;
    }

    // cancel end callback
    clearTimeout(this.endCallback);
    return true;
  }

  stop() {
    if (!runtimeState.stop()) {
      return false;
    }

    // cancel end callback
    clearTimeout(this.endCallback);
    return true;
  }

  /**
   * Adds time to running timer by given amount
   * @param {number} amount
   */
  addTime(amount: number): boolean {
    if (!runtimeState.addTime(amount)) {
      return false;
    }

    // renew end callback
    clearTimeout(this.endCallback);
    const state = runtimeState.getState();
    this.endCallback = setTimeout(() => this.update(), state.timer.expectedFinish);
    return true;
  }

  /**
   * Update the app at regular intervals
   */
  update() {
    const updateResult = runtimeState.update();
    // pass the result to the parent
    this.onUpdateCallback(updateResult);
  }

  /**
   * Loads roll information into timer service
   * @param {OntimeEvent[]} rundown -- list of events to run
   */
  roll(rundown: OntimeEvent[]) {
    runtimeState.roll(rundown);
  }

  shutdown() {
    clearInterval(this._interval);
    clearTimeout(this.endCallback);
  }
}
