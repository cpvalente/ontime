import { OntimeEvent } from 'ontime-types';

import { deepEqual } from 'fast-equals';

import { eventStore } from '../stores/EventStore.js';
import * as runtimeState from '../stores/runtimeState.js';
import type { RuntimeState, UpdateResult } from '../stores/runtimeState.js';

import { restoreService } from './RestoreService.js';

/**
 * Service manages Ontime's main timer
 * It is responsible for streaming the data to the event store
 */
export class TimerService {
  private readonly _interval: NodeJS.Timer;
  /** how often we update the socket */
  static _updateInterval: number;
  /** how often we recalculate */
  static _refreshInterval: number;
  /** last time we updated the socket */
  static previousUpdate: number;
  /** last known state */
  static previousState: RuntimeState;

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
    TimerService.previousUpdate = -1;
    TimerService.previousState = {} as RuntimeState;

    TimerService._updateInterval = timerConfig.updateInterval;
    TimerService._refreshInterval = timerConfig.refresh;

    this.onUpdateCallback = timerConfig.onUpdateCallback;
    this._interval = setInterval(() => {
      this.update();
      this.onUpdateCallback;
    }, TimerService._updateInterval);
  }

  @broadcastResult
  start() {
    if (!runtimeState.start()) {
      return false;
    }

    const state = runtimeState.getState();
    this.endCallback = setTimeout(this.update, state.timer.expectedFinish);
    return true;
  }

  @broadcastResult
  pause() {
    if (!runtimeState.pause()) {
      return;
    }

    // cancel end callback
    clearTimeout(this.endCallback);
  }

  @broadcastResult
  stop() {
    if (!runtimeState.stop()) {
      return false;
    }

    // cancel end callback
    clearTimeout(this.endCallback);
  }

  /**
   * Adds time to running timer by given amount
   * @param {number} amount
   */
  @broadcastResult
  addTime(amount: number): boolean {
    if (!runtimeState.addTime(amount)) {
      return false;
    }

    // renew end callback
    clearTimeout(this.endCallback);
    const state = runtimeState.getState();
    this.endCallback = setTimeout(this.update, state.timer.expectedFinish);
    return true;
  }

  /**
   * Update the app at regular intervals
   */
  @broadcastResult
  update() {
    const updateResult = runtimeState.update();

    // pass the result to the parent
    this.onUpdateCallback(updateResult);
  }

  /**
   * Loads roll information into timer service
   * @param {OntimeEvent[]} rundown -- list of events to run
   */
  @broadcastResult
  roll(rundown: OntimeEvent[]) {
    runtimeState.roll(rundown);
  }

  shutdown() {
    clearInterval(this._interval);
    clearTimeout(this.endCallback);
  }
}

function broadcastResult(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    // call the original method and get the state
    const result = originalMethod.apply(this, args);
    const state = runtimeState.getState();

    // we do the comparison by explicitly for each property
    // to apply custom logic for different datasets

    // assume clock always changes
    const isTimeToUpdate = state.clock - TimerService.previousUpdate >= TimerService._updateInterval;

    // some changes need an immediate update
    const hasSkippedBack = state.clock < TimerService.previousUpdate;
    const justStarted = !TimerService.previousState?.timer;
    const hasChangedPlayback = TimerService.previousState.timer?.playback !== state.timer.playback;
    const hasImmediateChanges = hasSkippedBack || justStarted || hasChangedPlayback;

    if (hasImmediateChanges || (isTimeToUpdate && !deepEqual(TimerService.previousState?.timer, state.timer))) {
      eventStore.set('timer', state.timer);
      TimerService.previousState.timer = { ...state.timer };
    }

    if (isTimeToUpdate && !deepEqual(TimerService.previousState?.runtime, state.runtime)) {
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

    if (isTimeToUpdate) {
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
