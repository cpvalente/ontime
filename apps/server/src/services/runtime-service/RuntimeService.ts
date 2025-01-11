import {
  EndAction,
  isOntimeEvent,
  isPlayableEvent,
  LogOrigin,
  MaybeNumber,
  OntimeEvent,
  Playback,
  RuntimeStore,
  TimerLifeCycle,
  TimerPhase,
  TimerState,
} from 'ontime-types';
import { millisToString, validatePlayback } from 'ontime-utils';

import { deepEqual } from 'fast-equals';

import { logger } from '../../classes/Logger.js';
import * as runtimeState from '../../stores/runtimeState.js';
import type { RuntimeState } from '../../stores/runtimeState.js';
import { timerConfig } from '../../config/config.js';
import { eventStore } from '../../stores/EventStore.js';

import { EventTimer } from '../EventTimer.js';
import { RestorePoint, restoreService } from '../RestoreService.js';
import {
  findNext,
  findPrevious,
  getEventAtIndex,
  getNextEventWithCue,
  getEventWithId,
  getRundown,
  getTimedEvents,
} from '../rundown-service/rundownUtils.js';
import { integrationService } from '../integration-service/IntegrationService.js';

import { getForceUpdate, getShouldClockUpdate, getShouldTimerUpdate } from './rundownService.utils.js';
import { skippedOutOfEvent } from '../timerUtils.js';
import { triggerAutomations } from '../../api-data/automation/automation.service.js';

/**
 * Service manages runtime status of app
 * Coordinating with necessary services
 */
class RuntimeService {
  private eventTimer: EventTimer;
  private lastIntegrationClockUpdate = -1;
  private lastIntegrationTimerValue = -1;

  /** last time we updated the socket */
  static previousTimerUpdate: number;
  static previousTimerValue: MaybeNumber; // previous timer value, could be null
  static previousClockUpdate: number;

  /** last known state */
  static previousState: RuntimeState;

  constructor(eventTimer: EventTimer) {
    this.eventTimer = eventTimer;

    RuntimeService.previousTimerUpdate = -1;
    RuntimeService.previousTimerValue = -1;
    RuntimeService.previousClockUpdate = -1;
    RuntimeService.previousState = {} as RuntimeState;
  }

  /**
   * Checks result of an update and notifies integrations as needed
   * This is the only exception of a private method that has broadcast result
   * */
  @broadcastResult
  private checkTimerUpdate({ hasTimerFinished, hasSecondaryTimerFinished }: runtimeState.UpdateResult) {
    const newState = runtimeState.getState();
    // 1. find if we need to dispatch integrations related to the phase
    const timerPhaseChanged = RuntimeService.previousState.timer?.phase !== newState.timer.phase;
    if (timerPhaseChanged) {
      if (newState.timer.phase === TimerPhase.Warning) {
        process.nextTick(() => {
          triggerAutomations(TimerLifeCycle.onWarning, newState);
        });
      } else if (newState.timer.phase === TimerPhase.Danger) {
        process.nextTick(() => {
          triggerAutomations(TimerLifeCycle.onDanger, newState);
        });
      }
    }

    // 2. handle edge cases related to roll
    if (newState.timer.playback === Playback.Roll) {
      // check if we need to call any side effects
      const keepOffset = newState.runtime.offset;
      if (hasSecondaryTimerFinished) {
        // if the secondary timer has finished, we need to call roll
        // since event is already loaded
        this.rollLoaded(keepOffset);
      } else if (hasTimerFinished) {
        // if the timer has finished, we need to load next and keep rolling
        process.nextTick(() => {
          triggerAutomations(TimerLifeCycle.onFinish, newState);
        });
        this.handleLoadNext();
        this.rollLoaded(keepOffset);
      } else if (
        // if there is no previous clock, we could not have skipped
        RuntimeService.previousState?.clock &&
        skippedOutOfEvent(newState, RuntimeService.previousState.clock, timerConfig.skipLimit)
      ) {
        // if we have skipped out of the event, we will recall roll
        // to push the playback to the right place
        // this comes with the caveat that we will lose our runtime data
        logger.warning(LogOrigin.Playback, 'Time skip detected, reloading roll');
        this.roll(true);
      }
    }

    // 3. find if we need to process actions related to the timer finishing
    if (newState.timer.playback === Playback.Play && hasTimerFinished) {
      process.nextTick(() => {
        triggerAutomations(TimerLifeCycle.onFinish, newState);
      });

      // handle end action if there was a timer playing
      // actions are added to the queue stack to ensure that the order of operations is maintained
      if (newState.eventNow) {
        if (newState.eventNow.endAction === EndAction.Stop) {
          setTimeout(this.stop.bind(this), 0);
        } else if (newState.eventNow.endAction === EndAction.LoadNext) {
          setTimeout(this.loadNext.bind(this), 0);
        } else if (newState.eventNow.endAction === EndAction.PlayNext) {
          setTimeout(this.startNext.bind(this), 0);
        }
      }
    }

    // 4. find if we need to update the timer
    const shouldUpdateTimer = getShouldTimerUpdate(this.lastIntegrationTimerValue, newState.timer.current);
    if (shouldUpdateTimer) {
      process.nextTick(() => {
        triggerAutomations(TimerLifeCycle.onUpdate, newState);
      });

      this.lastIntegrationTimerValue = newState.timer.current ?? -1;
    }

    // 5. find if we need to update the clock
    const shouldUpdateClock = getShouldClockUpdate(this.lastIntegrationClockUpdate, newState.clock);
    if (shouldUpdateClock) {
      process.nextTick(() => {
        triggerAutomations(TimerLifeCycle.onClock, newState);
      });

      this.lastIntegrationClockUpdate = newState.clock;
    }
  }

  /** delay initialisation until we have a restore point */
  public init(resumable: RestorePoint | null) {
    logger.info(LogOrigin.Server, 'Runtime service started');
    this.eventTimer.setOnUpdateCallback((updateResult) => this.checkTimerUpdate(updateResult));

    if (resumable) {
      this.resume(resumable);
    }
  }

  public shutdown() {
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
    const timedEvents = getTimedEvents();
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
  public notifyOfChangedEvents(affectedIds?: string[]) {
    const state = runtimeState.getState();
    const hasLoadedElements = state.eventNow !== null || state.eventNext !== null;
    if (!hasLoadedElements) {
      return;
    }

    // we need to reload in a few scenarios:
    // 1. we are not confident that changes do not affect running event (eg. all events where changed)
    const safeOption = affectedIds === undefined;
    // 2. the edited event is in memory (now or next) running
    // behind conditional to avoid doing unnecessary work
    const eventInMemory = safeOption ? false : this.affectsLoaded(affectedIds);
    // 3. the edited event replaces next event
    let isNext = false;

    // if we are not sure, or the event is in memory, we reload
    if (safeOption || eventInMemory) {
      if (state.eventNow !== null) {
        // load stuff again, but keep running if our events still exist
        const eventNow = getEventWithId(state.eventNow.id);
        if (!isOntimeEvent(eventNow) || !isPlayableEvent(eventNow)) {
          // maybe the event was deleted or the skip state was changed
          runtimeState.stop();
          return;
        }
        const onlyChangedNow = affectedIds?.length === 1 && affectedIds.at(0) === eventNow.id;

        if (onlyChangedNow) {
          runtimeState.updateLoaded(eventNow);
        } else {
          const rundown = getRundown();
          runtimeState.updateAll(rundown);
        }
        return;
      }
    }

    // Maybe the event will become the next
    isNext = this.isNewNext();
    if (isNext) {
      const timedEvents = getTimedEvents();
      runtimeState.loadNext(timedEvents);
    }
  }

  /**
   * makes calls for loading and starting given event
   * @param {PlayableEvent} event
   * @param {Partial<TimerState & RestorePoint>} initialData
   * @return {boolean} success - whether an event was loaded
   */
  private loadEvent(event: OntimeEvent, initialData?: Partial<TimerState & RestorePoint>): boolean {
    if (!isPlayableEvent(event)) {
      logger.warning(LogOrigin.Playback, `Refused skipped event with ID ${event.id}`);
      return false;
    }

    const rundown = getRundown();
    const success = runtimeState.load(event, rundown, initialData);

    if (success) {
      logger.info(LogOrigin.Playback, `Loaded event with ID ${event.id}`);
      process.nextTick(() => {
        triggerAutomations(TimerLifeCycle.onLoad, runtimeState.getState());
      });
    }
    return success;
  }

  public getRuntimeState() {
    return { playback: runtimeState.getState().timer.playback };
  }

  /**
   * starts event matching given ID
   * @param {string} eventId
   * @return {boolean} success - whether an event was started
   */
  @broadcastResult
  public startById(eventId: string): boolean {
    const event = getEventWithId(eventId);
    if (!event || !isOntimeEvent(event)) {
      return false;
    }
    const loaded = this.loadEvent(event);
    if (!loaded) {
      return false;
    }
    return this.handleStart();
  }

  /**
   * starts an event at index
   * @param {number} eventIndex
   * @return {boolean} success - whether an event was started
   */
  @broadcastResult
  public startByIndex(eventIndex: number): boolean {
    const event = getEventAtIndex(eventIndex);
    if (!event) {
      return false;
    }
    const loaded = this.loadEvent(event);
    if (!loaded) {
      return false;
    }
    return this.handleStart();
  }

  /**
   * starts first event matching given cue
   * @param {string} cue
   * @return {boolean} success - whether an event was started
   */
  @broadcastResult
  public startByCue(cue: string): boolean {
    const event = getNextEventWithCue(cue); //TODO: add index
    if (!event) {
      return false;
    }
    const loaded = this.loadEvent(event);
    if (!loaded) {
      return false;
    }
    return this.handleStart();
  }

  /**
   * loads event matching given ID
   * @param {string} eventId
   * @return {boolean} success - whether an event was loaded
   */
  @broadcastResult
  public loadById(eventId: string): boolean {
    const event = getEventWithId(eventId);
    if (!event || !isOntimeEvent(event)) {
      return false;
    }
    return this.loadEvent(event);
  }

  /**
   * loads event matching given ID
   * @param {number} eventIndex
   * @return {boolean} success - whether an event was loaded
   */
  @broadcastResult
  public loadByIndex(eventIndex: number): boolean {
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
  @broadcastResult
  public loadByCue(cue: string): boolean {
    const event = getNextEventWithCue(cue); //TODO: add index
    if (!event) {
      return false;
    }
    return this.loadEvent(event);
  }

  /**
   * Contains logic for loading the previous event
   *
   * we need to isolate handleLoadPrevious so we have control over the side effects
   * startSelected being a private function does not trigger emits
   */
  private handleLoadPrevious(): boolean {
    const state = runtimeState.getState();
    const previousEvent = findPrevious(state.eventNow?.id);
    if (previousEvent) {
      return this.loadEvent(previousEvent);
    }
    return false;
  }

  /**
   * Loads event before currently selected
   * @return {boolean} success - whether an event was loaded
   */
  @broadcastResult
  public loadPrevious(): boolean {
    return this.handleLoadPrevious();
  }

  /**
   * Contains logic for loading the next event
   *
   * we need to isolate handleLoadNext so we have control over the side effects
   * startSelected being a private function does not trigger emits
   * and pass on runtime offset in case of roll mode
   */
  private handleLoadNext(): boolean {
    const state = runtimeState.getState();
    const nextEvent = findNext(state.eventNow?.id);
    if (nextEvent) {
      if (state.timer.playback === Playback.Roll) {
        return this.loadEvent(nextEvent, { firstStart: state.runtime.actualStart });
      }
      return this.loadEvent(nextEvent);
    }

    logger.info(LogOrigin.Playback, 'No next event found! Continuing playback');
    return false;
  }

  /**
   * Loads event after currently selected
   * @return {boolean} success
   */
  @broadcastResult
  public loadNext(): boolean {
    return this.handleLoadNext();
  }

  /**
   * Contains logic for starting selected event
   *
   * we need to isolate handleStart so we have control over the side effects
   * startSelected being a private function does not trigger emits
   */
  private handleStart(): boolean {
    const previousState = runtimeState.getState();
    const canStart = validatePlayback(previousState.timer.playback, previousState.timer.phase).start;
    if (!canStart) {
      return false;
    }

    const didStart = this.eventTimer?.start() ?? false;
    const newState = runtimeState.getState();
    logger.info(LogOrigin.Playback, `Play Mode ${newState.timer.playback.toUpperCase()}`);

    if (didStart) {
      process.nextTick(() => {
        triggerAutomations(TimerLifeCycle.onStart, newState);
      });
    }
    return didStart;
  }

  /**
   * Starts playback on selected event
   */
  @broadcastResult
  public start(): boolean {
    return this.handleStart();
  }

  /**
   * Starts playback on previous event
   */
  @broadcastResult
  public startPrevious(): boolean {
    const hasPrevious = this.handleLoadPrevious();
    if (!hasPrevious) {
      return false;
    }

    return this.handleStart();
  }

  /**
   * Starts playback on next event
   */
  @broadcastResult
  public startNext(): boolean {
    const hasNext = this.handleLoadNext();
    if (!hasNext) {
      return false;
    }
    return this.handleStart();
  }

  /**
   * Pauses playback on selected event
   */
  @broadcastResult
  public pause() {
    const state = runtimeState.getState();
    const canPause = validatePlayback(state.timer.playback, state.timer.phase).pause;
    if (!canPause) {
      return;
    }
    this.eventTimer?.pause();
    const newState = runtimeState.getState();
    logger.info(LogOrigin.Playback, `Play Mode ${newState.timer.playback.toUpperCase()}`);
    process.nextTick(() => {
      triggerAutomations(TimerLifeCycle.onPause, newState);
    });
  }

  /**
   * Stops timer and unloads any events
   */
  @broadcastResult
  public stop(): boolean {
    const state = runtimeState.getState();
    const canStop = validatePlayback(state.timer.playback, state.timer.phase).stop;
    if (!canStop) {
      return false;
    }
    const didStop = this.eventTimer?.stop();
    if (didStop) {
      const newState = runtimeState.getState();
      logger.info(LogOrigin.Playback, `Play Mode ${newState.timer.playback.toUpperCase()}`);
      process.nextTick(() => {
        triggerAutomations(TimerLifeCycle.onStop, newState);
      });

      return true;
    }
    return false;
  }

  /**
   * Reloads current event
   */
  @broadcastResult
  public reload() {
    const state = runtimeState.getState();
    if (state.eventNow) {
      return this.loadEvent(state.eventNow);
    }
    return false;
  }

  /**
   * Handles special case to call roll on a loaded event which we do not want to discard
   */
  private rollLoaded(offset?: number) {
    const rundown = getRundown();
    try {
      runtimeState.roll(rundown, offset);
    } catch (error) {
      logger.error(LogOrigin.Server, `Roll: ${error}`);
    }
  }

  /**
   * Sets playback to roll
   */
  @broadcastResult
  public roll(skipCheck: boolean = false) {
    const previousState = runtimeState.getState();
    if (!skipCheck) {
      const canRoll = validatePlayback(previousState.timer.playback, previousState.timer.phase).roll;
      if (!canRoll) {
        return;
      }
    }

    try {
      const rundown = getRundown();
      const result = runtimeState.roll(rundown);
      const newState = runtimeState.getState();
      if (result.eventId !== previousState.eventNow?.id) {
        logger.info(LogOrigin.Playback, `Loaded event with ID ${result.eventId}`);
        process.nextTick(() => {
          triggerAutomations(TimerLifeCycle.onLoad, newState);
        });
      }

      if (result.didStart) {
        process.nextTick(() => {
          triggerAutomations(TimerLifeCycle.onStart, newState);
        });
      }
    } catch (error) {
      logger.error(LogOrigin.Server, `Roll: ${error}`);
      return;
    }

    const newState = runtimeState.getState();

    if (previousState.timer.playback !== newState.timer.playback) {
      logger.info(LogOrigin.Playback, `Play Mode ${newState.timer.playback.toUpperCase()}`);
    }
  }

  /**
   * @description resume playback state given a restore point
   * @param restorePoint
   */
  @broadcastResult
  public resume(restorePoint: RestorePoint) {
    const { selectedEventId, playback } = restorePoint;
    if (playback === Playback.Roll) {
      this.roll();
      return;
    }

    if (!selectedEventId) {
      return;
    }

    // the db would have to change for the event not to exist
    // we do not know the reason for the crash, so we check anyway
    const event = getEventWithId(selectedEventId);
    if (!isOntimeEvent(event) || !isPlayableEvent(event)) {
      return;
    }

    const rundown = getRundown();
    runtimeState.resume(restorePoint, event, rundown);
    logger.info(LogOrigin.Playback, 'Resuming playback');
  }

  /**
   * Adds time to current event
   * @param {number} time - time to add in milliseconds
   */
  @broadcastResult
  public addTime(time: number) {
    if (this.eventTimer.addTime(time)) {
      logger.info(LogOrigin.Playback, `${time > 0 ? 'Added' : 'Removed'} ${millisToString(time)}`);
    }
  }
}

// calculate at 30fps, refresh at 1fps
const eventTimer = new EventTimer({
  refresh: timerConfig.updateRate,
  updateInterval: timerConfig.notificationRate,
});
export const runtimeService = new RuntimeService(eventTimer);

/**
 * Decorator manages side effects from updating the runtime
 * This should only be applied to functions that are exposed for consumption
 * ie: whenever an external service makes a request, we update the state with the mutation result
 */
function broadcastResult(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    // call the original method and get the state
    const result = originalMethod.apply(this, args);
    const state = runtimeState.getState();

    // we do the comparison by explicitly for each property
    // to apply custom logic for different datasets

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

    let syncBlockStartAt = false;

    if (!deepEqual(RuntimeService?.previousState.currentBlock, state.currentBlock)) {
      eventStore.set('currentBlock', state.currentBlock);
      RuntimeService.previousState.currentBlock = { ...state.currentBlock };
      syncBlockStartAt = true;
    }

    const shouldUpdateClock = syncBlockStartAt || getShouldClockUpdate(RuntimeService.previousClockUpdate, state.clock);

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
        blockStartAt: state.currentBlock.startedAt,
      });
    }

    return result;
  };

  return descriptor;
}
