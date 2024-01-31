import { EndAction, OntimeEvent, Playback, TimerLifeCycle } from 'ontime-types';

import * as runtimeState from '../stores/runtimeState.js';
import { integrationService } from './integration-service/IntegrationService.js';
import { eventStore } from '../stores/EventStore.js';
import { restoreService } from './RestoreService.js';
import { runtimeService } from './runtime-service/RuntimeService.js';
import { getPlayableEvents } from './rundown-service/RundownService.js';

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

  @broadcastResult
  start() {
    // TODO: when we start a timer, we schedule an update to its expected end - 16ms
    // we need to cancel this timer on pause, stop and addTime
    if (runtimeState.start()) {
      integrationService.dispatch(TimerLifeCycle.onStart);
    }
  }

  @broadcastResult
  pause() {
    if (runtimeState.pause()) {
      integrationService.dispatch(TimerLifeCycle.onPause);
    }
  }

  @broadcastResult
  stop() {
    if (runtimeState.stop()) {
      integrationService.dispatch(TimerLifeCycle.onStop);
    }
  }

  /**
   * Adds time to running timer by given amount
   * @param {number} amount
   */
  @broadcastResult
  addTime(amount: number): boolean {
    return runtimeState.addTime(amount);
  }

  /**
   * Update the app at regular intervals
   * @param {boolean} force whether we should force a broadcast of state
   */
  @broadcastResult
  update(force = false) {
    const { didUpdate, doRoll, isFinished, shouldNotify } = runtimeState.update(force, this._updateInterval);
    if (didUpdate && shouldNotify) {
      // TODO: can we distinguish between a clock update and a timer update?
      integrationService.dispatch(TimerLifeCycle.onUpdate);
    }

    if (doRoll) {
      // TODO: escalate to parent
      const rundown = getPlayableEvents();
      runtimeState.roll(rundown);
    }

    if (isFinished) {
      integrationService.dispatch(TimerLifeCycle.onFinish);
      const newState = runtimeState.getState();

      // handle end action if there was a timer playing
      if (newState.timer.playback === Playback.Play) {
        if (newState.eventNow.endAction === EndAction.Stop) {
          runtimeState.stop();
        } else if (newState.eventNow.endAction === EndAction.LoadNext) {
          // we need to delay here to put this action in the queue stack. otherwise it won't be executed properly
          setTimeout(runtimeState.loadNext, 0);
        } else if (newState.eventNow.endAction === EndAction.PlayNext) {
          // TODO: avoid calling the runtime service here
          runtimeService.startNext();
        }
      }
    }
  }

  /**
   * Loads roll information into timer service
   * @throws {Error} if rundown is empty
   * @param {OntimeEvent[]} rundown -- list of events to run
   */
  @broadcastResult
  roll(rundown: OntimeEvent[]) {
    if (rundown.length === 0) {
      throw new Error('No events found');
    }

    runtimeState.roll(rundown);
  }

  shutdown() {
    clearInterval(this._interval);
  }
}

function broadcastResult(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const result = originalMethod.apply(this, args);
    const state = runtimeState.getState();

    // TODO: compare datasets to see what needs to be emitted
    eventStore.batchSet({
      clock: state.clock,
      eventNow: state.eventNow,
      publicEventNow: state.publicEventNow,
      eventNext: state.eventNext,
      publicEventNext: state.publicEventNext,
      runtime: state.runtime,
      timer: state.timer,
    });

    // we write to restore service if the underlying data changes
    restoreService.save({
      playback: state.timer.playback,
      selectedEventId: state.eventNow?.id ?? null,
      startedAt: state.timer.startedAt,
      addedTime: state.timer.addedTime,
      pausedAt: state._timer.pausedAt,
    });
    return result;
  };

  return descriptor;
}
