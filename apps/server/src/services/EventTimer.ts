import * as runtimeState from '../stores/runtimeState.js';
import type { UpdateResult } from '../stores/runtimeState.js';

type UpdateCallbackFn = (updateResult: UpdateResult) => void;

/**
 * Manages Ontime's main timer
 */
export class EventTimer {
  private readonly _interval: NodeJS.Timeout;
  /** how often we recalculate */
  static _refreshInterval: number;

  /** anticipates the next boundary, see scheduleNextBoundary */
  private boundaryCallback: NodeJS.Timeout | undefined = undefined;

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

    this.scheduleNextBoundary();
    return true;
  }

  pause() {
    if (!runtimeState.pause()) {
      return false;
    }

    this.scheduleNextBoundary();
    return true;
  }

  stop() {
    if (!runtimeState.stop()) {
      return false;
    }

    this.scheduleNextBoundary();
    return true;
  }

  /**
   * Adds time to running timer by given amount
   */
  addTime(amount: number): boolean {
    if (!runtimeState.addTime(amount)) {
      return false;
    }

    this.scheduleNextBoundary();
    return true;
  }

  /**
   * Update the app at regular intervals
   */
  update() {
    const updateResult = runtimeState.update();
    // pass the result to the parent
    this.onUpdateCallback?.(updateResult);
    // the update, and anything it triggered, could have moved the next boundary
    this.scheduleNextBoundary();
  }

  /**
   * Schedules an update for the next boundary which carries side effects.
   *
   * The interval resolves a boundary to its own rate, so an event which ends between
   * two ticks is only seen ending on the tick after it was due to. We look ahead one
   * cycle and, when the boundary falls inside it, schedule a dedicated update for it.
   *
   * Derived from the state on every update, which is what covers the mutations that
   * reach the runtime without going through this class, such as roll or a restored
   * playback, provided their caller signals the change.
   */
  scheduleNextBoundary() {
    clearTimeout(this.boundaryCallback);
    this.boundaryCallback = undefined;

    const timeToBoundary = runtimeState.getTimeToNextBoundary();
    if (timeToBoundary === null || timeToBoundary >= EventTimer._refreshInterval) {
      return;
    }

    // a boundary which is already due is left to the interval: the update which would
    // resolve it has just run, so scheduling it again would spin until the state moves
    if (timeToBoundary <= 0) {
      return;
    }

    this.boundaryCallback = setTimeout(() => this.update(), timeToBoundary);
  }

  shutdown() {
    clearInterval(this._interval);
    clearTimeout(this.boundaryCallback);
  }
}
