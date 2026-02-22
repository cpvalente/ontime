import { Maybe } from 'ontime-types';
import { timerConfig } from '../setup/config.js';
import { runtimeState, update as runtimeUpdate } from '../stores/runtimeState.js';
import type { UpdateResult } from '../stores/runtimeState.js';

type UpdateCallbackFn = (updateResult: UpdateResult) => void;

/**
 * Manages Ontime's main timer
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
    const { current } = mapRuntimeState();

    // eslint-disable-next-line no-unused-labels -- dev code path
    DEV: {
      if (current === null) {
        throw new Error('EventTimer.start: invalid state received');
      }
    }

    // register a callback for the scheduled end
    const endTime = current - timerConfig.triggerAhead;
    this.endCallback = setTimeout(() => this.update(), endTime);
  }

  pause() {
    // cancel end callback
    clearTimeout(this.endCallback);
  }

  stop() {
    // cancel end callback
    clearTimeout(this.endCallback);
  }

  /**
   * Adds time to running timer by given amount
   */
  addTime(): boolean {
    // renew end callback
    clearTimeout(this.endCallback);
    const { expectedFinish } = mapRuntimeState();
    // eslint-disable-next-line no-unused-labels -- dev code path
    DEV: {
      if (expectedFinish === null) {
        throw new Error('TimerService.addTime: expectedFinish is negative');
      }
    }
    this.endCallback = setTimeout(() => this.update(), expectedFinish);
    return true;
  }

  /**
   * Update the app at regular intervals
   */
  update() {
    const updateResult = runtimeUpdate();
    // pass the result to the parent
    this.onUpdateCallback?.(updateResult);
  }

  shutdown() {
    clearInterval(this._interval);
    clearTimeout(this.endCallback);
  }
}

function mapRuntimeState(): {
  expectedFinish: Maybe<number>;
  current: Maybe<number>;
} {
  return {
    expectedFinish: runtimeState.timer.expectedFinish,
    current: runtimeState.timer.current,
  };
}
