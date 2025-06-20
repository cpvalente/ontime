import * as runtimeState from '../stores/runtimeState.js';
import type { UpdateResult } from '../stores/runtimeState.js';
import { timerConfig } from '../config/config.js';

type UpdateCallbackFn = (updateResult: UpdateResult) => void;

/**
 * Service manages Ontime's main timer
 */
export class EventTimer {
  private readonly _interval: NodeJS.Timeout;
  /** how often we recalculate */
  static _refreshInterval: number;

  /** when timer will be finished */
  private endCallback: NodeJS.Timeout | undefined = undefined;

  private onUpdateCallback: UpdateCallbackFn | undefined = undefined;

  /**
   * @constructor
   * @param {number} [timerConfig.refresh] how often we recalculate
   * @param {number} [timerConfig.updateInterval] how often we update the socket
   * @param {function} [timerConfig.onUpdateCallback] how often we update the socket
   */
  constructor(timerConfig: { refresh: number; updateInterval: number }) {
    EventTimer._refreshInterval = timerConfig.refresh;
    this._interval = setInterval(() => {
      this.update();
    }, EventTimer._refreshInterval);
  }

  /**
   * Allows setting a callback for when the timer updates
   */
  setOnUpdateCallback(callback: (updateResult: UpdateResult) => void) {
    this.onUpdateCallback = callback;
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
   */
  addTime(amount: number): boolean {
    if (!runtimeState.addTime(amount)) {
      return false;
    }

    // renew end callback
    clearTimeout(this.endCallback);
    const state = runtimeState.getState();
    // eslint-disable-next-line no-unused-labels -- dev code path
    DEV: {
      if (state.timer.expectedFinish === null) {
        throw new Error('TimerService.addTime: expectedFinish is negative');
      }
    }
    this.endCallback = setTimeout(() => this.update(), state.timer.expectedFinish);
    return true;
  }

  /**
   * Update the app at regular intervals
   */
  update() {
    const updateResult = runtimeState.update();
    // pass the result to the parent
    this.onUpdateCallback?.(updateResult);
  }

  shutdown() {
    clearInterval(this._interval);
    clearTimeout(this.endCallback);
  }
}
