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
    this._interval = setInterval(this.update, this._refreshInterval);
  }

  start() {
    if (!state.runtime.selectedEventId) {
      return;
    }

    if (state.playback === Playback.Play) {
      return;
    }

    // TODO: when we start a timer, we schedule an update to its expected end - 16ms
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
    if (state.runtime.selectedEventId === null) {
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
   * @param {OntimeEvent | null} currentEvent -- both current event and next event cant be null
   * @param {OntimeEvent | null} nextEvent -- both current event and next event cant be null
   * @param {OntimeEvent[]} rundown -- list of events to run
   */
  roll(currentEvent: OntimeEvent | null, nextEvent: OntimeEvent | null, rundown: OntimeEvent[]) {
    stateMutations.timer.roll(currentEvent, nextEvent, rundown);
  }

  shutdown() {
    clearInterval(this._interval);
  }
}
