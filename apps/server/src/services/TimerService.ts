import { OntimeEvent, Playback } from 'ontime-types';

import { stateMutations, state } from '../state.js';

/**
 * Service manages Ontime's main timer
 */
export class TimerService {
  private _interval: NodeJS.Timer;
  private _updateInterval: number;
  private _refreshInterval: number;

  /**
   * @constructor
   * @param {number} [timerConfig.refresh]
   * @param {number} [timerConfig.updateInterval]
   */
  constructor(timerConfig: { refresh: number; updateInterval: number }) {
    this._refreshInterval = timerConfig.refresh;
    this._updateInterval = timerConfig.updateInterval;
    this._interval = setInterval(this.update, 32);
  }

  start() {
    if (!state.eventNow) {
      return;
    }

    if (state.timer.playback === Playback.Play) {
      return;
    }

    // TODO: when we start a timer, we schedule an update to its expected end - 16ms
    // we need to cancel this timer on pause, stop and addTime
    stateMutations.timer.start();
  }

  pause() {
    if (state.timer.playback !== Playback.Play) {
      return;
    }
    stateMutations.timer.pause();
  }

  stop() {
    if (state.timer.playback === Playback.Stop) {
      return;
    }
    stateMutations.timer.stop();
  }

  /**
   * Adds time to running timer by given amount
   * @param {number} amount
   */
  addTime(amount: number) {
    if (state.eventNow === null) {
      return;
    }
    stateMutations.timer.addTime(amount);
  }

  /**
   * Update the app at regular intervals
   * @param {boolean} force whether we should force a broadcast of state
   */
  update(force = false) {
    stateMutations.timer.update(force, this._updateInterval);
  }

  /**
   * Loads roll information into timer service
   * @throws {Error} if rundown is empty
   * @param {OntimeEvent[]} rundown -- list of events to run
   */
  roll(rundown: OntimeEvent[]) {
    if (rundown.length === 0) {
      throw new Error('No events found');
    }

    stateMutations.timer.roll(rundown);
  }

  shutdown() {
    clearInterval(this._interval);
  }
}
