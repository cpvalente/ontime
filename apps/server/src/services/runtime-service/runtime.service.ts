import {
  EndAction,
  EntryId,
  isOntimeEvent,
  isPlayableEvent,
  LogOrigin,
  Maybe,
  Offset,
  OffsetMode,
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
import { eventStore } from '../../stores/EventStore.js';
import { triggerReportEntry } from '../../api-data/report/report.service.js';
import { timerConfig } from '../../setup/config.js';
import { triggerAutomations } from '../../api-data/automation/automation.service.js';
import { getCurrentRundown, getEntryWithId, getRundownMetadata } from '../../api-data/rundown/rundown.dao.js';

import { EventTimer } from '../EventTimer.js';
import type { RestorePoint } from '../restore-service/restore.type.js';
import { RestoreService } from '../restore-service/restore.service.js';
import { skippedOutOfEvent } from '../timerUtils.js';

import {
  findNextPlayableId,
  findNextPlayableWithCue,
  findPreviousPlayableId,
  getEventAtIndex,
  getShouldClockUpdate,
  getShouldOffsetUpdate,
  getShouldTimerUpdate,
  isNewSecond,
} from './runtime.utils.js';
import { RundownMetadata } from '../../api-data/rundown/rundown.types.js';

/**
 * Service manages runtime status of app
 * Coordinating with necessary services
 */
class RuntimeService {
  private readonly eventTimer: EventTimer;
  private lastIntegrationClockUpdate = -1;
  private lastIntegrationTimerValue = -1;
  public restoreService: RestoreService | null = null;

  /** last known state */
  static previousState: RuntimeState;

  constructor(eventTimer: EventTimer) {
    this.eventTimer = eventTimer;
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
      if (hasSecondaryTimerFinished) {
        // if the secondary timer has finished, we need to call roll
        // since event is already loaded
        this.rollLoaded(newState.offset);
      } else if (hasTimerFinished) {
        // if the timer has finished, we need to load next and keep rolling
        process.nextTick(() => {
          triggerAutomations(TimerLifeCycle.onFinish, newState);
        });
        this.handleLoadNext();
        this.rollLoaded(newState.offset);
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
  public init(resumable: Maybe<RestorePoint>, restoreService: RestoreService) {
    logger.info(LogOrigin.Server, 'Runtime service started');
    this.eventTimer.setOnUpdateCallback((updateResult) => this.checkTimerUpdate(updateResult));

    this.restoreService = restoreService;
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
    const { timedEventOrder } = getRundownMetadata();

    const event = findNextPlayableWithCue(
      rundown,
      timedEventOrder,
      cue,
      state.rundown.selectedEventIndex ?? undefined,
      state.timer.playback === Playback.Armed, // If we are armed allow the armed event to be considered for playback
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
      state.rundown.selectedEventIndex ?? undefined,
      false,
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
  private handleLoadNext(fromId?: EntryId): boolean {
    const state = runtimeState.getState();
    const { playableEventOrder } = getRundownMetadata();

    const nextId = findNextPlayableId(playableEventOrder, fromId ?? state.eventNow?.id);

    if (nextId) {
      const nextEvent = getEntryWithId(nextId);
      if (!nextEvent || !isOntimeEvent(nextEvent)) {
        return false;
      }

      if (state.timer.playback === Playback.Roll) {
        if (nextEvent.duration === 0) {
          /**
           * when loading next in roll mode,
           * we need to prevent loading events of 0 duration since
           * this would make the playback be stuck
           */
          return this.handleLoadNext(nextId);
        }
        return this.loadEvent(nextEvent, { firstStart: state.rundown.actualStart });
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
  private rollLoaded(offset: Offset) {
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

type EntryUpdateKeys = keyof Pick<RuntimeState, 'eventNow' | 'eventNext' | 'eventFlag' | 'groupNow'>;

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

    // Update the entry if they have changed
    let entryChanged = false;
    entryChanged ||= updateMaybeEntryIfChanged('eventNow');
    entryChanged ||= updateMaybeEntryIfChanged('eventNext');
    entryChanged ||= updateMaybeEntryIfChanged('eventFlag');
    entryChanged ||= updateMaybeEntryIfChanged('groupNow');

    // for the very fist run there will be nothing in the previousState so we force an update
    const justStarted = !RuntimeService.previousState?.timer;

    // offset mode has been changed
    const offsetModeChanged = RuntimeService.previousState?.offset?.mode !== state.offset.mode;

    // if playback changes most things should update
    const hasChangedPlayback = RuntimeService.previousState.timer?.playback !== state.timer.playback;

    const addedTimeChanged = !justStarted && RuntimeService.previousState?.timer.addedTime !== state.timer.addedTime;

    // combine all big changes
    const hasImmediateChanges =
      entryChanged || justStarted || hasChangedPlayback || offsetModeChanged || addedTimeChanged;

    /**
     * if any values have changed.
     * values that have the possibility to tick are updated when the seconds roll over
     */
    const updateTimer = getShouldTimerUpdate(RuntimeService.previousState?.timer, state.timer);
    if (updateTimer) {
      batch.add('timer', state.timer);
      RuntimeService.previousState.timer = { ...state.timer };
    }

    /**
     * clock has changed by a second or more.
     * or the timer updated so we ensure that the timer and clock ticks are in sync
     */
    const updateClock = updateTimer || getShouldClockUpdate(RuntimeService.previousState.clock, state.clock);
    if (updateClock) {
      batch.add('clock', state.clock);
      RuntimeService.previousState.clock = state.clock;
    }

    /**
     * if any values have changed.
     * values that have the possibility to tick are modulated by `updateClock || hasImmediateChanges`
     */
    const updateRuntime = getShouldOffsetUpdate(
      RuntimeService.previousState?.offset,
      state.offset,
      updateClock || hasImmediateChanges,
    );
    if (updateRuntime) {
      batch.add('offset', state.offset);
      RuntimeService.previousState.offset = structuredClone(state.offset);
    }

    /**
     * if any values have changed.
     */
    const updateRundownData = !deepEqual(RuntimeService.previousState.rundown, state.rundown);
    if (updateRundownData) {
      batch.add('rundown', state.rundown);
      RuntimeService.previousState.rundown = structuredClone(state.rundown);
    }

    function updateMaybeEntryIfChanged<K extends EntryUpdateKeys>(key: K) {
      const previousEntry = RuntimeService.previousState[key];
      const currentEntry = state[key];

      if (!previousEntry && !currentEntry) return false; // if both are null -> skip

      // if they have the same id the check if the contents have changed
      if (previousEntry?.id === currentEntry?.id) {
        if (deepEqual(previousEntry, currentEntry)) return false; // contents are the same -> skip
      }
      // at this point we know that either the id or the contents has changed
      batch.add(key, currentEntry as RuntimeStore[K]); // we know that there is the necessary overlap in the types to cast this
      RuntimeService.previousState[key] = structuredClone(currentEntry);
      return true;
    }

    // save the restore state
    if (hasImmediateChanges && runtimeService.restoreService) {
      runtimeService.restoreService
        .save({
          playback: state.timer.playback,
          selectedEventId: state.eventNow?.id ?? null,
          startedAt: state.timer.startedAt,
          addedTime: state.timer.addedTime,
          pausedAt: state._timer.pausedAt,
          firstStart: state.rundown.actualStart,
          startEpoch: state._startEpoch,
          currentDay: state.rundown.currentDay,
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
