import {
  EndAction,
  isOntimeEvent,
  isPlayableEvent,
  LogOrigin,
  MaybeNumber,
  OffsetMode,
  OntimeEvent,
  Playback,
  TimerLifeCycle,
  TimerPhase,
  TimerState,
} from 'ontime-types';
import { millisToString, validatePlayback } from 'ontime-utils';

import { deepEqual } from 'fast-equals';

import { logger } from '../../classes/Logger.js';
import * as runtimeState from '../../stores/runtimeState.js';
import type { RuntimeState } from '../../stores/runtimeState.js';
import { eventStore } from '../../stores/EventStore.js';
import { triggerReportEntry } from '../../api-data/report/report.service.js';
import { timerConfig } from '../../setup/config.js';
import { triggerAutomations } from '../../api-data/automation/automation.service.js';
import { getCurrentRundown, getEntryWithId, getRundownMetadata } from '../../api-data/rundown/rundown.dao.js';

import { EventTimer } from '../EventTimer.js';
import { RestorePoint, restoreService } from '../RestoreService.js';
import { skippedOutOfEvent } from '../timerUtils.js';

import {
  findNextPlayableId,
  findNextPlayableWithCue,
  findPreviousPlayableId,
  getEventAtIndex,
  getShouldClockUpdate,
  getShouldFlagUpdate,
  getShouldGroupUpdate,
  getShouldRuntimeUpdate,
  getShouldTimerUpdate,
  isNewSecond,
} from './rundownService.utils.js';
import { RundownMetadata } from '../../api-data/rundown/rundown.types.js';

type RuntimeStateEventKeys = keyof Pick<RuntimeState, 'eventNext' | 'eventNow'>;

/**
 * Service manages runtime status of app
 * Coordinating with necessary services
 */
class RuntimeService {
  private readonly eventTimer: EventTimer;
  private lastIntegrationClockUpdate = -1;
  private lastIntegrationTimerValue = -1;

  /** last time we updated the socket */
  static previousTimerUpdate: number;
  static previousRuntimeUpdate: number;
  static previousTimerValue: MaybeNumber; // previous timer value, could be null
  static previousClockUpdate: number;

  /** last known state */
  static previousState: RuntimeState;

  constructor(eventTimer: EventTimer) {
    this.eventTimer = eventTimer;

    RuntimeService.previousTimerUpdate = -1;
    RuntimeService.previousRuntimeUpdate = -1;
    RuntimeService.previousTimerValue = -1;
    RuntimeService.previousClockUpdate = -1;
    RuntimeService.previousState = {} as RuntimeState;
  }

  @broadcastResult
  setOffsetMode(mode: OffsetMode) {
    runtimeState.setOffsetMode(mode);
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
      const keepOffset = newState.runtime.offsetAbs;
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
        if (newState.eventNow.endAction === EndAction.LoadNext) {
          setTimeout(this.loadNext.bind(this), 0);
        } else if (newState.eventNow.endAction === EndAction.PlayNext) {
          setTimeout(this.startNext.bind(this), 0);
        }
      }
    }

    // 4. find if we need to update the timer
    const shouldUpdateTimer = isNewSecond(this.lastIntegrationTimerValue, newState.timer.current);
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
   * Called when the underlying data has changed,
   * we check if the change affects the runtime
   */
  public notifyOfChangedEvents(rundownMetadata: RundownMetadata) {
    const state = runtimeState.getState();
    const hasLoadedElements = state.eventNow !== null || state.eventNext !== null;
    if (!hasLoadedElements) {
      return;
    }

    // all events were deleted
    if (rundownMetadata.playableEventOrder.length === 0) {
      runtimeState.stop();
    }

    const rundown = getCurrentRundown();
    const metadata = getRundownMetadata();
    runtimeState.updateAll(rundown, metadata);
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
    const previousState = runtimeState.getState();

    // we can ignore events which are not playable
    const rundown = getCurrentRundown();
    const metadata = getRundownMetadata();
    const success = runtimeState.load(event, rundown, metadata, initialData);

    if (success) {
      logger.info(LogOrigin.Playback, `Loaded event with ID ${event.id}`);
      const newState = runtimeState.getState();
      process.nextTick(() => {
        triggerReportEntry(TimerLifeCycle.onStop, previousState);
        triggerAutomations(TimerLifeCycle.onLoad, newState);
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
    const event = getEntryWithId(eventId);
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
    const rundown = getCurrentRundown();
    const { timedEventOrder } = getRundownMetadata();

    const event = getEventAtIndex(rundown, timedEventOrder, eventIndex);

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
    const state = runtimeState.getState();
    const rundown = getCurrentRundown();
    const { playableEventOrder } = getRundownMetadata();

    const event = findNextPlayableWithCue(
      rundown,
      playableEventOrder,
      cue,
      state.runtime.selectedEventIndex ?? undefined,
    );

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
    const event = getEntryWithId(eventId);
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
    const rundown = getCurrentRundown();
    const { timedEventOrder } = getRundownMetadata();

    const event = getEventAtIndex(rundown, timedEventOrder, eventIndex);

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
    const state = runtimeState.getState();
    const rundown = getCurrentRundown();
    const { playableEventOrder } = getRundownMetadata();

    const event = findNextPlayableWithCue(
      rundown,
      playableEventOrder,
      cue,
      state.runtime.selectedEventIndex ?? undefined,
    );

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
    const { playableEventOrder } = getRundownMetadata();

    const previousId = findPreviousPlayableId(playableEventOrder, state.eventNow?.id);
    if (previousId) {
      const previousEvent = getEntryWithId(previousId);
      if (previousEvent && isOntimeEvent(previousEvent)) {
        return this.loadEvent(previousEvent);
      }
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
    const { playableEventOrder } = getRundownMetadata();

    const nextId = findNextPlayableId(playableEventOrder, state.eventNow?.id);
    if (nextId) {
      const nextEvent = getEntryWithId(nextId);
      if (!nextEvent || !isOntimeEvent(nextEvent)) {
        return false;
      }

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
        triggerReportEntry(TimerLifeCycle.onStart, newState);
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
    const previousState = runtimeState.getState();
    const canStop = validatePlayback(previousState.timer.playback, previousState.timer.phase).stop;
    if (!canStop) {
      return false;
    }
    const didStop = this.eventTimer?.stop();
    if (didStop) {
      const newState = runtimeState.getState();
      logger.info(LogOrigin.Playback, `Play Mode ${newState.timer.playback.toUpperCase()}`);
      process.nextTick(() => {
        triggerReportEntry(TimerLifeCycle.onStop, previousState);
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
    const rundown = getCurrentRundown();
    const metadata = getRundownMetadata();

    try {
      runtimeState.roll(rundown, metadata, offset);
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
      const rundown = getCurrentRundown();
      const metadata = getRundownMetadata();
      const result = runtimeState.roll(rundown, metadata);

      const newState = runtimeState.getState();
      if (result.eventId !== previousState.eventNow?.id) {
        logger.info(LogOrigin.Playback, `Loaded event with ID ${result.eventId}`);
        process.nextTick(() => {
          triggerReportEntry(TimerLifeCycle.onStop, previousState);
          triggerAutomations(TimerLifeCycle.onLoad, newState);
        });
      }

      if (result.didStart) {
        process.nextTick(() => {
          triggerReportEntry(TimerLifeCycle.onStart, newState);
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
    const event = getEntryWithId(selectedEventId);
    if (!isOntimeEvent(event) || !isPlayableEvent(event)) {
      return;
    }

    const rundown = getCurrentRundown();
    const metadata = getRundownMetadata();
    runtimeState.resume(restorePoint, event, rundown, metadata);

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
    const batch = eventStore.createBatch();

    // we do the comparison by explicitly for each property
    // to apply custom logic for different datasets

    // if a new event was loaded most things should update
    const hasNewLoaded = state.eventNow?.id !== RuntimeService.previousState?.eventNow?.id;

    // for the very fist run there will be nothing in the previousState so we force an update
    const justStarted = !RuntimeService.previousState?.timer;

    // offset mode has been changed
    const offsetModeChanged = RuntimeService.previousState?.runtime?.offsetMode !== state.runtime.offsetMode;

    // if playback changes most things should update
    const hasChangedPlayback = RuntimeService.previousState.timer?.playback !== state.timer.playback;

    // combine all big changes
    const hasImmediateChanges = hasNewLoaded || justStarted || hasChangedPlayback || offsetModeChanged;

    // clock has changed by a second or more
    const updateClock = getShouldClockUpdate(RuntimeService.previousState.clock, state.clock);
    if (updateClock) {
      batch.add('clock', state.clock);
      RuntimeService.previousState.clock = state.clock;
    }

    // if any values have changed, values that have the possibility to tick are updated when the seconds roll over
    const updateTimer = getShouldTimerUpdate(RuntimeService.previousState?.timer, state.timer);
    if (updateTimer) {
      batch.add('timer', state.timer);
      RuntimeService.previousTimerUpdate = state.clock;
      RuntimeService.previousTimerValue = state.timer.current;
      RuntimeService.previousState.timer = { ...state.timer };
    }

    // if any values have changed, values that have the possibility to tick are modulated by `hasClockUpdate`
    const updateRuntime = getShouldRuntimeUpdate(
      RuntimeService.previousState?.runtime,
      state.runtime,
      updateClock || hasImmediateChanges,
    );
    if (updateRuntime) {
      batch.add('runtime', state.runtime);
      RuntimeService.previousRuntimeUpdate = state.clock;
      RuntimeService.previousState.runtime = structuredClone(state.runtime);
    }

    // if any values have changed, values that have the possibility to tick are modulated by `hasClockUpdate`
    const updateGroupNow = getShouldGroupUpdate(
      RuntimeService.previousState.groupNow,
      state.groupNow,
      updateClock || hasImmediateChanges,
    );
    if (updateGroupNow) {
      batch.add('groupNow', state.groupNow);
      RuntimeService.previousState.groupNow = structuredClone(state.groupNow);
    }

    // next group is just a simple string or null compare
    const updateGroupNext = RuntimeService.previousState.groupNext !== state.groupNext;
    if (updateGroupNext) {
      batch.add('groupNext', state.groupNext);
      RuntimeService.previousState.groupNext = structuredClone(state.groupNext);
    }

    // if any values have changed, values that have the possibility to tick are modulated by `hasClockUpdate`
    const updateFlag = getShouldFlagUpdate(
      RuntimeService.previousState.nextFlag,
      state.nextFlag,
      updateClock || hasImmediateChanges,
    );
    if (updateFlag) {
      batch.add('nextFlag', state.nextFlag);
      RuntimeService.previousState.nextFlag = structuredClone(state.nextFlag);
    }

    // Update the events if they have changed
    updateEventIfChanged('eventNow', state);
    updateEventIfChanged('eventNext', state);

    // Helper function to update an event if it has changed
    function updateEventIfChanged(eventKey: RuntimeStateEventKeys, state: runtimeState.RuntimeState) {
      const previous = RuntimeService.previousState?.[eventKey];
      const now = state[eventKey];

      // if there was nothing, and there is nothing, noop
      if (!previous?.id && !now?.id) return;

      const eventChanged =
        // if load status changed, save new
        previous?.id !== now?.id ||
        // maybe the event itself has changed
        !deepEqual(RuntimeService.previousState?.[eventKey], state[eventKey]);

      if (!eventChanged) return;

      batch.add(eventKey, state[eventKey]);
      RuntimeService.previousState[eventKey] = structuredClone(state[eventKey]);
    }

    // save the restore state
    if (hasImmediateChanges) {
      restoreService
        .save({
          playback: state.timer.playback,
          selectedEventId: state.eventNow?.id ?? null,
          startedAt: state.timer.startedAt,
          addedTime: state.timer.addedTime,
          pausedAt: state._timer.pausedAt,
          firstStart: state.rundown.actualStart,
        })
        .catch((_e) => {
          //we don't do anything with the error here
        });
    }

    batch.send();
    return result;
  };

  return descriptor;
}
