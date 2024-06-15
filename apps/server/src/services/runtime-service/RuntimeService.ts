import {
  EndAction,
  LogOrigin,
  MaybeNumber,
  OntimeEvent,
  Playback,
  RuntimeStore,
  TimerLifeCycle,
  TimerPhase,
} from 'ontime-types';
import { millisToString, validatePlayback } from 'ontime-utils';

import { deepEqual } from 'fast-equals';

import { logger } from '../../classes/Logger.js';
import * as runtimeState from '../../stores/runtimeState.js';
import type { RuntimeState } from '../../stores/runtimeState.js';
import { timerConfig } from '../../config/config.js';
import { eventStore } from '../../stores/EventStore.js';

import { TimerService } from '../TimerService.js';
import { RestorePoint, restoreService } from '../RestoreService.js';
import {
  findNext,
  findPrevious,
  getEventAtIndex,
  getNextEventWithCue,
  getEventWithId,
  getPlayableEvents,
} from '../rundown-service/rundownUtils.js';
import { integrationService } from '../integration-service/IntegrationService.js';
import { getForceUpdate, getShouldClockUpdate, getShouldTimerUpdate } from './rundownService.utils.js';

/**
 * Service manages runtime status of app
 * Coordinating with necessary services
 */
class RuntimeService {
  private eventTimer: TimerService | null = null;
  private lastIntegrationClockUpdate = -1;
  private lastIntegrationTimerValue = -1;

  /** last time we updated the socket */
  static previousTimerUpdate: number;
  static previousTimerValue: MaybeNumber;
  static previousClockUpdate: number;
  /** last known state */
  static previousState: RuntimeState;

  constructor() {
    RuntimeService.previousTimerUpdate = -1;
    RuntimeService.previousTimerValue = -1;
    RuntimeService.previousClockUpdate = -1;
    RuntimeService.previousState = {} as RuntimeState;
  }

  /** Checks result of an update and notifies integrations as needed */
  @broadcastResult
  checkTimerUpdate({ shouldCallRoll, hasTimerFinished }: runtimeState.UpdateResult) {
    const newState = runtimeState.getState();
    if (hasTimerFinished) {
      process.nextTick(() => {
        integrationService.dispatch(TimerLifeCycle.onFinish);
      });

      // handle end action if there was a timer playing
      // actions are added to the queue stack to ensure that the order of operations is maintained
      if (newState.timer.playback === Playback.Play && newState.eventNow) {
        if (newState.eventNow.endAction === EndAction.Stop) {
          setTimeout(this.stop.bind(this), 0);
        } else if (newState.eventNow.endAction === EndAction.LoadNext) {
          setTimeout(this.loadNext.bind(this), 0);
        } else if (newState.eventNow.endAction === EndAction.PlayNext) {
          setTimeout(this.startNext.bind(this), 0);
        }
      }
    }

    const hasRunningTimer = Boolean(newState.eventNow) && newState.timer.playback === Playback.Play;
    const shouldUpdateTimer =
      hasRunningTimer && getShouldTimerUpdate(this.lastIntegrationTimerValue, newState.timer.current);

    if (shouldUpdateTimer) {
      process.nextTick(() => {
        integrationService.dispatch(TimerLifeCycle.onUpdate);
      });

      this.lastIntegrationTimerValue = newState.timer.current ?? -1;
    }

    const shouldUpdateClock = getShouldClockUpdate(this.lastIntegrationClockUpdate, newState.clock);
    if (shouldUpdateClock) {
      process.nextTick(() => {
        integrationService.dispatch(TimerLifeCycle.onClock);
      });

      this.lastIntegrationClockUpdate = newState.clock;
    }

    if (shouldCallRoll) {
      // we dont call this.roll because we need to bypass the checks
      const rundown = getPlayableEvents();
      this.eventTimer.roll(rundown);
    }

    const timerPhaseChanged = RuntimeService.previousState.timer?.phase !== newState.timer.phase;

    if (timerPhaseChanged) {
      switch (newState.timer.phase) {
        case TimerPhase.Warning:
          process.nextTick(() => {
            integrationService.dispatch(TimerLifeCycle.onWarning);
          });
          break;
        case TimerPhase.Danger:
          process.nextTick(() => {
            integrationService.dispatch(TimerLifeCycle.onDanger);
          });
          break;
        default:
          break;
      }
    }
  }

  /** delay initialisation until we have a restore point */
  init(resumable: RestorePoint | null) {
    logger.info(LogOrigin.Server, 'Runtime service started');
    // calculate at 30fps, refresh at 1fps
    this.eventTimer = new TimerService({
      refresh: timerConfig.updateRate,
      updateInterval: timerConfig.notificationRate,
      onUpdateCallback: (updateResult) => this.checkTimerUpdate(updateResult),
    });

    if (resumable) {
      this.resume(resumable);
    }
  }

  shutdown() {
    if (this.eventTimer) {
      logger.info(LogOrigin.Server, 'Runtime service shutting down');
      this.eventTimer.shutdown();
    }
  }

  /**
   * Checks if a list of IDs is in the current selection
   */
  private affectsLoaded(affectedIds: string[]): boolean {
    const state = runtimeState.getState();
    const now = state.eventNow?.id;
    const nowPublic = state.publicEventNow?.id;
    const next = state.eventNext?.id;
    const nextPublic = state.publicEventNext?.id;
    return (
      affectedIds.includes(now) ||
      affectedIds.includes(nowPublic) ||
      affectedIds.includes(next) ||
      affectedIds.includes(nextPublic)
    );
  }

  private isNewNext() {
    const timedEvents = getPlayableEvents();
    const state = runtimeState.getState();
    const now = state.eventNow?.id;
    const next = state.eventNext?.id;

    // check whether the index of now and next are consecutive
    const indexNow = timedEvents.findIndex((event) => event.id === now);
    const indexNext = timedEvents.findIndex((event) => event.id === next);

    if (indexNext - indexNow !== 1) {
      return true;
    }
    // iterate through timed events and see if there are public events between nowPublic and nextPublic
    const nowPublic = state.publicEventNow?.id;
    const nextPublic = state.publicEventNext?.id;

    let foundNew = false;
    let isAfter = false;
    for (const event of timedEvents) {
      if (!isAfter) {
        if (event.id === nowPublic) {
          isAfter = true;
        }
      } else {
        if (event.id === nextPublic) {
          break;
        }
        if (event.isPublic) {
          foundNew = true;
          break;
        }
      }
    }

    return foundNew;
  }

  /**
   * Called when the underlying data has changed,
   * we check if the change affects the runtime
   */
  maybeUpdate(playableEvents: OntimeEvent[], affectedIds?: string[]) {
    const state = runtimeState.getState();
    const hasLoadedElements = state.eventNow !== null || state.eventNext !== null;
    if (!hasLoadedElements) {
      return;
    }

    // we need to reload in a few scenarios:
    // 1. we are not confident that changes do not affect running event (eg. all events where changed)
    const safeOption = typeof affectedIds === 'undefined';
    // 2. the edited event is in memory (now or next) running
    const eventInMemory = safeOption ? false : this.affectsLoaded(affectedIds);
    // 3. the edited event replaces next event
    let isNext = false;

    if (safeOption || eventInMemory) {
      if (state.timer.playback === Playback.Roll) {
        this.roll();
      }
      // load stuff again, but keep running if our events still exist
      const eventNow = getEventWithId(state.eventNow.id);
      const onlyChangedNow = affectedIds?.length === 1 && affectedIds.at(0) === eventNow.id;
      if (onlyChangedNow) {
        runtimeState.reload(eventNow);
      } else {
        runtimeState.reloadAll(eventNow, playableEvents);
      }
      return;
    }

    // Maybe the event will become the next
    isNext = this.isNewNext();
    if (isNext) {
      runtimeState.loadNext(playableEvents);
    }
  }

  /**
   * makes calls for loading and starting given event
   * @param {OntimeEvent} event
   * @return {boolean} success - whether an event was loaded
   */
  @broadcastResult
  loadEvent(event: OntimeEvent): boolean {
    if (event.skip) {
      logger.warning(LogOrigin.Playback, `Refused skipped event with ID ${event.id}`);
      return false;
    }

    const timedEvents = getPlayableEvents();
    const success = runtimeState.load(event, timedEvents);

    if (success) {
      logger.info(LogOrigin.Playback, `Loaded event with ID ${event.id}`);
      process.nextTick(() => {
        integrationService.dispatch(TimerLifeCycle.onLoad);
      });
    }
    return success;
  }

  /**
   * starts event matching given ID
   * @param {string} eventId
   * @return {boolean} success - whether an event was started
   */
  startById(eventId: string): boolean {
    const event = getEventWithId(eventId);
    if (!event) {
      return false;
    }
    const loaded = this.loadEvent(event);
    if (!loaded) {
      return false;
    }
    return this.start();
  }

  /**
   * starts an event at index
   * @param {number} eventIndex
   * @return {boolean} success - whether an event was started
   */
  startByIndex(eventIndex: number): boolean {
    const event = getEventAtIndex(eventIndex);
    if (!event) {
      return false;
    }
    const loaded = this.loadEvent(event);
    if (!loaded) {
      return false;
    }
    return this.start();
  }

  /**
   * starts first event matching given cue
   * @param {string} cue
   * @return {boolean} success - whether an event was started
   */
  startByCue(cue: string): boolean {
    const event = getNextEventWithCue(cue); //TODO: add index
    if (!event) {
      return false;
    }
    const loaded = this.loadEvent(event);
    if (!loaded) {
      return false;
    }
    return this.start();
  }

  /**
   * loads event matching given ID
   * @param {string} eventId
   * @return {boolean} success - whether an event was loaded
   */
  loadById(eventId: string): boolean {
    const event = getEventWithId(eventId);
    if (!event) {
      return false;
    }
    return this.loadEvent(event);
  }

  /**
   * loads event matching given ID
   * @param {number} eventIndex
   * @return {boolean} success - whether an event was loaded
   */
  loadByIndex(eventIndex: number): boolean {
    const event = getEventAtIndex(eventIndex);
    if (!event) {
      return false;
    }
    return this.loadEvent(event);
  }

  /**
   * loads first event matching given cue
   * @param {string} cue
   * @return {boolean} success - whether an event was loaded
   */
  loadByCue(cue: string): boolean {
    const event = getNextEventWithCue(cue); //TODO: add index
    if (!event) {
      return false;
    }
    return this.loadEvent(event);
  }

  /**
   * Loads event before currently selected
   * @return {boolean} success - whether an event was loaded
   */
  loadPrevious(): boolean {
    const state = runtimeState.getState();
    const previousEvent = findPrevious(state.eventNow?.id);
    if (previousEvent) {
      return this.loadEvent(previousEvent);
    }
    return false;
  }

  /**
   * Loads event after currently selected
   * @return {boolean} success
   */
  loadNext(): boolean {
    const state = runtimeState.getState();
    const nextEvent = findNext(state.eventNow?.id);
    if (nextEvent) {
      return this.loadEvent(nextEvent);
    }

    logger.info(LogOrigin.Playback, 'No next event found! Continuing playback');
    return false;
  }

  /**
   * Starts playback on selected event
   */
  @broadcastResult
  start(): boolean {
    const state = runtimeState.getState();
    const canStart = validatePlayback(state.timer.playback).start;
    if (!canStart) {
      return false;
    }

    const didStart = this.eventTimer?.start() ?? false;
    logger.info(LogOrigin.Playback, `Play Mode ${state.timer.playback.toUpperCase()}`);
    if (didStart) {
      process.nextTick(() => {
        integrationService.dispatch(TimerLifeCycle.onStart);
      });
    }
    return didStart;
  }

  /**
   * Starts playback on previous event
   */
  startPrevious(): boolean {
    const hasPrevious = this.loadPrevious();
    if (!hasPrevious) {
      return false;
    }

    return this.start();
  }

  /**
   * Starts playback on next event
   */
  startNext(): boolean {
    const hasNext = this.loadNext();
    if (!hasNext) {
      return false;
    }

    return this.start();
  }

  /**
   * Pauses playback on selected event
   */
  @broadcastResult
  pause() {
    const state = runtimeState.getState();
    const canPause = validatePlayback(state.timer.playback).pause;
    if (!canPause) {
      return;
    }
    this.eventTimer?.pause();
    const newState = state.timer.playback;
    logger.info(LogOrigin.Playback, `Play Mode ${newState.toUpperCase()}`);
    process.nextTick(() => {
      integrationService.dispatch(TimerLifeCycle.onPause);
    });
  }

  /**
   * Stops timer and unloads any events
   */
  @broadcastResult
  stop(): boolean {
    const state = runtimeState.getState();
    const canStop = validatePlayback(state.timer.playback).stop;
    if (!canStop) {
      return false;
    }
    const didStop = this.eventTimer?.stop();
    if (didStop) {
      const newState = state.timer.playback;
      logger.info(LogOrigin.Playback, `Play Mode ${newState.toUpperCase()}`);
      process.nextTick(() => {
        integrationService.dispatch(TimerLifeCycle.onStop);
      });

      return true;
    }
    return false;
  }

  /**
   * Reloads current event
   */
  @broadcastResult
  reload() {
    const state = runtimeState.getState();
    if (state.eventNow) {
      runtimeState.reload();
    }
  }

  /**
   * Sets playback to roll
   */
  @broadcastResult
  roll() {
    const beforeState = runtimeState.getState();
    const canRoll = validatePlayback(beforeState.timer.playback).roll;
    if (!canRoll) {
      return;
    }

    const playableEvents = getPlayableEvents();
    if (playableEvents.length === 0) {
      logger.warning(LogOrigin.Server, 'Roll: no events found');
      return;
    }

    this.eventTimer.roll(playableEvents);

    const state = runtimeState.getState();
    const newState = state.timer.playback;
    logger.info(LogOrigin.Playback, `Play Mode ${newState.toUpperCase()}`);
  }

  /**
   * @description resume playback state given a restore point
   * @param restorePoint
   */
  @broadcastResult
  resume(restorePoint: RestorePoint) {
    const { selectedEventId, playback } = restorePoint;
    if (playback === Playback.Roll) {
      this.roll();
      return;
    }

    if (!selectedEventId) {
      return;
    }

    // the db would have to change for the event not to exist
    // we do not kow the reason for the crash, so we check anyway
    const event = getEventWithId(selectedEventId);
    if (!event) {
      return;
    }

    const timedEvents = getPlayableEvents();
    runtimeState.resume(restorePoint, event, timedEvents);
    logger.info(LogOrigin.Playback, 'Resuming playback');
  }

  /**
   * Adds time to current event
   * @param {number} time - time to add in milliseconds
   */
  addTime(time: number) {
    if (this.eventTimer.addTime(time)) {
      logger.info(LogOrigin.Playback, `${time > 0 ? 'Added' : 'Removed'} ${millisToString(time)}`);
    }
  }
}

export const runtimeService = new RuntimeService();

function broadcastResult(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    // call the original method and get the state
    const result = originalMethod.apply(this, args);
    const state = runtimeState.getState();

    // we do the comparison by explicitly for each property
    // to apply custom logic for different datasets

    const shouldUpdateClock = getShouldClockUpdate(RuntimeService.previousClockUpdate, state.clock);
    const shouldForceTimerUpdate = getForceUpdate(RuntimeService.previousTimerUpdate, state.clock);
    const shouldUpdateTimer =
      shouldForceTimerUpdate || getShouldTimerUpdate(RuntimeService.previousTimerValue, state.timer.current);

    // some changes need an immediate update
    const hasNewLoaded = state.eventNow?.id !== RuntimeService.previousState?.eventNow?.id;

    const justStarted = !RuntimeService.previousState?.timer;
    const hasChangedPlayback = RuntimeService.previousState.timer?.playback !== state.timer.playback;
    const hasImmediateChanges = hasNewLoaded || justStarted || hasChangedPlayback;

    if (hasChangedPlayback) {
      eventStore.set('onAir', state.timer.playback !== Playback.Stop);
    }

    if (hasImmediateChanges || (shouldUpdateTimer && !deepEqual(RuntimeService.previousState?.timer, state.timer))) {
      RuntimeService.previousTimerUpdate = state.clock;
      RuntimeService.previousTimerValue = state.timer.current;
      eventStore.set('timer', state.timer);
      RuntimeService.previousState.timer = { ...state.timer };
    }

    if (hasChangedPlayback || (shouldUpdateTimer && !deepEqual(RuntimeService.previousState?.runtime, state.runtime))) {
      eventStore.set('runtime', state.runtime);
      RuntimeService.previousState.runtime = { ...state.runtime };
    }

    // Update the events if they have changed
    updateEventIfChanged('eventNow', state);
    updateEventIfChanged('publicEventNow', state);
    updateEventIfChanged('eventNext', state);
    updateEventIfChanged('publicEventNext', state);

    if (shouldUpdateClock) {
      RuntimeService.previousClockUpdate = state.clock;
      eventStore.set('clock', state.clock);
      saveRestoreState(state);
    }

    // Helper function to update an event if it has changed
    function updateEventIfChanged(eventKey: keyof RuntimeStore, state: runtimeState.RuntimeState) {
      const previous = RuntimeService.previousState?.[eventKey];
      const now = state[eventKey];

      // if there was nothing, and there is nothing, noop
      if (!previous?.id && !now?.id) {
        return;
      }

      // if load status changed, save new
      if (previous?.id !== now?.id) {
        storeKey(eventKey);
        return;
      }

      // maybe the event itself has changed
      if (!deepEqual(RuntimeService.previousState?.[eventKey], state[eventKey])) {
        storeKey(eventKey);
        return;
      }

      function storeKey(eventKey: keyof RuntimeStore) {
        eventStore.set(eventKey, state[eventKey]);
        RuntimeService.previousState[eventKey] = { ...state[eventKey] };
      }
    }

    // Helper function to save the restore state
    function saveRestoreState(state: runtimeState.RuntimeState) {
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
