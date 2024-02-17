import { EndAction, OntimeEvent, Playback, TimerLifeCycle } from 'ontime-types';

import { deepEqual } from 'fast-equals';

import { eventStore } from '../stores/EventStore.js';
import * as runtimeState from '../stores/runtimeState.js';
import type { RuntimeState } from '../stores/runtimeState.js';

import { integrationService } from './integration-service/IntegrationService.js';
import { restoreService } from './RestoreService.js';
import { runtimeService } from './runtime-service/RuntimeService.js';
import { getPlayableEvents } from './rundown-service/RundownService.js';

/**
 * Service manages Ontime's main timer
 */
export class TimerService {
  private _interval: NodeJS.Timer;
  static _updateInterval: number; // how often we update the socket
  static _refreshInterval: number; // how often we recalculate
  static previousUpdate: number; // last time we updates the socket
  static previousState: RuntimeState;

  /**
   * @constructor
   * @param {number} [timerConfig.refresh]
   * @param {number} [timerConfig.updateInterval]
   */
  constructor(timerConfig: { refresh: number; updateInterval: number }) {
    this._interval = setInterval(this.update, 32);
    TimerService._updateInterval = timerConfig.updateInterval;
    TimerService._refreshInterval = timerConfig.refresh;
    TimerService.previousUpdate = -1;
    TimerService.previousState = {} as RuntimeState;
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
    const { didUpdate, doRoll, isFinished, shouldNotify } = runtimeState.update(force, TimerService._updateInterval);
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
      if (newState.timer.playback === Playback.Play && newState.eventNow) {
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
    // call the original method and get the state
    const result = originalMethod.apply(this, args);
    const state = runtimeState.getState();

    // we do the comparison by explicitely fop each property
    // to apply custom logic for different datasets

    // assume clock always changes
    const shouldUpdate = state.clock - TimerService.previousUpdate >= TimerService._updateInterval;

    const hasImmediateChanges =
      !TimerService.previousState?.timer || TimerService.previousState.timer.playback !== state.timer.playback;
    if (hasImmediateChanges || (shouldUpdate && !deepEqual(TimerService.previousState?.timer, state.timer))) {
      eventStore.set('timer', state.timer);
      TimerService.previousState.timer = { ...state.timer };
    }

    if (shouldUpdate && !deepEqual(TimerService.previousState?.runtime, state.runtime)) {
      eventStore.set('runtime', state.runtime);
      TimerService.previousState.runtime = { ...state.runtime };
    }

    if (!deepEqual(TimerService.previousState?.eventNow, state.eventNow)) {
      eventStore.set('eventNow', state.eventNow);
      TimerService.previousState.eventNow = { ...state.eventNow };
    }

    if (!deepEqual(TimerService.previousState?.publicEventNow, state.publicEventNow)) {
      eventStore.set('publicEventNow', state.publicEventNow);
      TimerService.previousState.publicEventNow = { ...state.publicEventNow };
    }

    if (!deepEqual(TimerService.previousState?.eventNext, state.eventNext)) {
      eventStore.set('eventNext', state.eventNext);
      TimerService.previousState.eventNext = { ...state.eventNext };
    }

    if (!deepEqual(TimerService.previousState?.publicEventNext, state.publicEventNext)) {
      eventStore.set('publicEventNext', state.publicEventNext);
      TimerService.previousState.publicEventNext = { ...state.publicEventNext };
    }

    if (shouldUpdate) {
      TimerService.previousUpdate = state.clock;
      eventStore.set('clock', state.clock);

      // we write to restore service if the underlying data changes
      restoreService.save({
        playback: state.timer.playback,
        selectedEventId: state.eventNow?.id ?? null,
        startedAt: state.timer.startedAt,
        addedTime: state.timer.addedTime,
        pausedAt: state._timer.pausedAt,
        firstStart: state.runtime.actualStart,
      });
    }

    return result;
  };

  return descriptor;
}
