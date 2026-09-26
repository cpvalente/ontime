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

  /** anticipates a playback boundary which falls inside the current refresh cycle */
  private boundaryCallback: NodeJS.Timeout | undefined = undefined;

  private onUpdateCallback: UpdateCallbackFn | undefined = undefined;

  /**
   * @constructor
   * @param {number} [timerConfig.refresh] how often we recalculate
   */
  constructor(timerConfig: { refresh: number }) {
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
    // the update or its side effects may have moved the boundary
    this.scheduleNextBoundary();
  }

  /**
   * The refresh interval can only resolve a boundary on its own tick
   * If the next boundary falls before the next tick, we schedule an update for it
   * Must be called whenever the runtime state changes outside of an update
   */
  scheduleNextBoundary() {
    clearTimeout(this.boundaryCallback);
    this.boundaryCallback = undefined;

    const timeToBoundary = runtimeState.getTimeToNextBoundary();
    if (timeToBoundary === null || timeToBoundary >= EventTimer._refreshInterval) {
      return;
    }

    // a due boundary is already being resolved by the update that found it
    // rescheduling it would spin the runtime if its side effects fail to clear the boundary
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
