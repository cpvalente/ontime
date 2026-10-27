import { deepEqual } from 'fast-equals';
import {
  EndAction,
  EntryId,
  Instant,
  LogOrigin,
  OffsetMode,
  OntimeEvent,
  Playback,
  RefetchKey,
  RuntimeStore,
  TimerLifeCycle,
  TimerPhase,
  isOntimeEvent,
  isPlayableEvent,
} from 'ontime-types';
import { getErrorMessage, millisToString, validatePlayback } from 'ontime-utils';

import { triggerAutomations } from '../../api-data/automation/automation.service.js';
import * as logger from '../../api-data/logs/logs.service.js';
import { triggerReportEntry } from '../../api-data/report/report.service.js';
import {
  getCurrentRundown,
  getCurrentRundownId,
  getEntryWithId,
  getRundownMetadata,
} from '../../api-data/rundown/rundown.dao.js';
import { cloneEntryData, isLoadedPlayable } from '../../api-data/rundown/rundown.utils.js';
import * as timeCore from '../../lib/time-core/timeCore.js';
import { timerConfig } from '../../setup/config.js';
import { eventStore } from '../../stores/EventStore.js';
import * as runtimeState from '../../stores/runtimeState.js';
import type { RuntimeState } from '../../stores/runtimeState.js';
import { type Change, onChange } from '../change-service/change.service.js';
import { restoreService } from '../restore-service/restore.service.js';
import type { RuntimeRestore } from '../restore-service/restore.types.js';
import { findNextRollEvent } from './roll.utils.js';
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
import { createTickingTimer } from './tickingTimer.js';
import { skippedOutOfEvent } from './timer.utils.js';

/**
 * Service manages runtime status of app
 * Coordinating with necessary services
 */
class RuntimeService {
  /** calculates at 30fps, read by broadcastResult to anticipate the next boundary */
  readonly timer = createTickingTimer({
    interval: timerConfig.updateRate,
    onTick: (at) => this.checkTimerUpdate(runtimeState.update(at)),
  });
  private lastIntegrationClockUpdate = -1;
  private lastIntegrationTimerValue = -1;
  private stopListening: (() => void) | undefined;

  /** last known state */
  static previousState: RuntimeState;

  constructor() {
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
  private checkTimerUpdate({ hasTimerFinished, finishedAt, hasSecondaryTimerFinished }: runtimeState.UpdateResult) {
    const newState = runtimeState.getState();
    // 1. find if we need to dispatch integrations related to the phase
    const timerPhaseChanged = RuntimeService.previousState.timer?.phase !== newState.timer.phase;
    if (timerPhaseChanged) {
      if (newState.timer.phase === TimerPhase.Warning) {
        emitLifecycle({ cycle: TimerLifeCycle.onWarning, state: newState });
      } else if (newState.timer.phase === TimerPhase.Danger) {
        emitLifecycle({ cycle: TimerLifeCycle.onDanger, state: newState });
      }
    }

    // 2. roll moves on by itself, the runtime decides where to
    if (newState.timer.playback === Playback.Roll) {
      if (hasSecondaryTimerFinished) {
        // the loaded event we were waiting for is due
        this.handleRollTransition(newState, () => runtimeState.roll(getCurrentRundown(), getRundownMetadata()));
      } else if (hasTimerFinished) {
        emitLifecycle({ cycle: TimerLifeCycle.onFinish, state: newState });
        this.handleRollTransition(newState, () => runtimeState.rollNext(getCurrentRundown(), getRundownMetadata()));
      } else if (
        // if there is no previous clock, we could not have skipped
        RuntimeService.previousState?.clock &&
        skippedOutOfEvent(newState, RuntimeService.previousState.clock, timerConfig.skipLimit)
      ) {
        // if we have skipped out of the event, we will recall roll
        // to push the playback to the right place
        // this comes with the caveat that we will lose our runtime data
        logger.warning(LogOrigin.Playback, 'Roll reloaded', { reason: 'time-skip' });
        this.handleRoll(true);
      }
    }

    // 3. find if we need to process actions related to the timer finishing
    if (newState.timer.playback === Playback.Play && hasTimerFinished) {
      emitLifecycle({ cycle: TimerLifeCycle.onFinish, state: newState });

      // handle end action if there was a timer playing
      // actions are added to the queue stack to ensure that the order of operations is maintained
      if (newState.eventNow) {
        if (newState.eventNow.endAction === EndAction.LoadNext) {
          logger.info(LogOrigin.Playback, 'End action triggered', {
            action: 'load-next',
            ...eventFields(newState.eventNow),
          });
          setTimeout(this.loadNext.bind(this), 0);
        } else if (newState.eventNow.endAction === EndAction.PlayNext) {
          // the next event starts when this one ends, which may be a moment after it was detected
          const finishedId = newState.eventNow.id;
          const finishedFields = eventFields(newState.eventNow);
          const end = finishedAt ?? timeCore.now();
          setTimeout(
            () => {
              // playback may have changed while waiting
              const { eventNow, timer } = runtimeState.getState();
              if (eventNow?.id !== finishedId || timer.playback !== Playback.Play) return;

              // after a time skip (eg: the system slept) the end is long past, so the next event starts now
              const now = timeCore.now();
              const isOnTime = timeCore.timeSince(now, end) <= timerConfig.skipLimit;
              logger.info(LogOrigin.Playback, 'End action triggered', {
                action: 'play-next',
                ...finishedFields,
                late: !isOnTime || undefined,
              });
              this.startNext(isOnTime ? end : now);
            },
            Math.max(0, timeCore.timeUntil(timeCore.now(), end)),
          );
        }
      }
    }

    // 4. find if we need to update the timer
    const shouldUpdateTimer = isNewSecond(this.lastIntegrationTimerValue, newState.timer.current);
    if (shouldUpdateTimer) {
      emitLifecycle({ cycle: TimerLifeCycle.onUpdate, state: newState });
      this.lastIntegrationTimerValue = newState.timer.current ?? -1;
    }

    // 5. find if we need to update the clock
    const shouldUpdateClock = getShouldClockUpdate(this.lastIntegrationClockUpdate, newState.clock);
    if (shouldUpdateClock) {
      emitLifecycle({ cycle: TimerLifeCycle.onClock, state: newState });
      this.lastIntegrationClockUpdate = newState.clock;
    }
  }

  /** delay initialisation until we have a restore point */
  public init(resumable: RuntimeRestore | null) {
    this.timer.start();

    // the project loads before the runtime, nothing is loaded yet so we only catch up with the rundown data
    runtimeState.updateRundownData(getRundownMetadata());
    this.stopListening = onChange((change) => this.handleChange(change));

    if (resumable) {
      this.resume(resumable);
    }
  }

  public shutdown() {
    this.stopListening?.();
    this.timer.stop();
  }

  /**
   * Returns the id of the currently loaded event, or null if none is loaded
   */
  public getLoadedEventId(): EntryId | null {
    return runtimeState.getState().eventNow?.id ?? null;
  }

  /**
   * Reconciles with changes to the loaded rundown, a rundown change without an id affects every rundown
   */
  private handleChange({ target, rundownId }: Change) {
    const isLoadedRundownChange =
      target === RefetchKey.All ||
      (target === RefetchKey.Rundown && (rundownId === undefined || rundownId === getCurrentRundownId()));
    if (isLoadedRundownChange) {
      this.notifyOfChangedEvents();
    }
  }

  /**
   * Called after every change to the loaded rundown, in the same call as the commit,
   * so the runtime never runs on stale data
   * Stops playback if the loaded event can no longer play, otherwise hot-reloads the loaded entries
   * The rundown and its metadata are read from the cache, so they are always the loaded and current ones
   */
  @broadcastResult
  public notifyOfChangedEvents() {
    const rundown = getCurrentRundown();
    const metadata = getRundownMetadata();
    runtimeState.updateRundownData(metadata);

    const state = runtimeState.getState();
    if (state.eventNow === null && state.eventNext === null) {
      return;
    }

    if (metadata.playableEventOrder.length === 0) {
      this.stop();
      logger.warning(LogOrigin.Playback, 'Playback stopped', { reason: 'no-playable-events' });
      return;
    }

    const loadedEventId = this.getLoadedEventId();
    if (loadedEventId !== null && !isLoadedPlayable(loadedEventId, rundown)) {
      this.stop();
      return;
    }

    runtimeState.updateAll(rundown, metadata);
  }

  /**
   * makes calls for loading and starting given event
   * @param {PlayableEvent} event
   * @return {boolean} success - whether an event was loaded
   */
  private loadEvent(event: OntimeEvent): boolean {
    if (!isPlayableEvent(event)) {
      logger.warning(LogOrigin.Playback, 'Event load skipped', { reason: 'marked-skip', ...eventFields(event) });
      return false;
    }
    const previousState = runtimeState.getState();

    // we can ignore events which are not playable
    const rundown = getCurrentRundown();
    const metadata = getRundownMetadata();
    const success = runtimeState.load(event, rundown, metadata);

    if (success) {
      logger.info(LogOrigin.Playback, 'Event loaded', eventFields(event));
      emitLifecycle({ cycle: TimerLifeCycle.onLoad, state: runtimeState.getState(), unloaded: previousState });
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
   */
  private handleLoadNext(): boolean {
    const state = runtimeState.getState();
    const metadata = getRundownMetadata();

    // a manual load next during roll passes over the events roll cannot play
    const nextId =
      state.timer.playback === Playback.Roll
        ? findNextRollEvent(getCurrentRundown(), metadata, state.eventNow?.id)?.id
        : findNextPlayableId(metadata.playableEventOrder, state.eventNow?.id);

    if (nextId) {
      const nextEvent = getEntryWithId(nextId);
      if (!nextEvent || !isOntimeEvent(nextEvent)) {
        return false;
      }
      return this.loadEvent(nextEvent);
    }

    logger.info(LogOrigin.Playback, 'Load next skipped', { reason: 'no-next-event' });
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
  private handleStart(at?: Instant): boolean {
    const previousState = runtimeState.getState();
    const canStart = validatePlayback(previousState.timer.playback, previousState.timer.phase).start;
    if (!canStart) {
      return false;
    }

    const didStart = runtimeState.start(undefined, at);
    const newState = runtimeState.getState();
    logger.info(LogOrigin.Playback, 'Playback changed', { state: newState.timer.playback });

    if (didStart) {
      emitLifecycle({ cycle: TimerLifeCycle.onStart, state: newState });
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
  public startNext(at?: Instant): boolean {
    const hasNext = this.handleLoadNext();
    if (!hasNext) {
      return false;
    }
    return this.handleStart(at);
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
    runtimeState.pause();
    const newState = runtimeState.getState();
    logger.info(LogOrigin.Playback, 'Playback changed', { state: newState.timer.playback });
    emitLifecycle({ cycle: TimerLifeCycle.onPause, state: newState });
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
    const didStop = runtimeState.stop();
    if (didStop) {
      const newState = runtimeState.getState();
      logger.info(LogOrigin.Playback, 'Playback changed', { state: newState.timer.playback });
      emitLifecycle({ cycle: TimerLifeCycle.onStop, state: newState, unloaded: previousState });

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
   * Sets playback to roll
   */
  @broadcastResult
  public roll() {
    this.handleRoll();
  }

  /**
   * Contains logic for setting playback to roll
   *
   * we need to isolate handleRoll so we have control over the side effects
   * handleRoll being a private function does not trigger emits
   */
  private handleRoll(skipCheck: boolean = false) {
    const previousState = runtimeState.getState();
    if (!skipCheck) {
      const canRoll = validatePlayback(previousState.timer.playback, previousState.timer.phase).roll;
      if (!canRoll) {
        return;
      }
    }

    const didRoll = this.handleRollTransition(previousState, () =>
      runtimeState.roll(getCurrentRundown(), getRundownMetadata()),
    );
    if (!didRoll) {
      return;
    }

    const newState = runtimeState.getState();
    if (previousState.timer.playback !== newState.timer.playback) {
      logger.info(LogOrigin.Playback, 'Playback changed', { state: newState.timer.playback });
    }
  }

  /**
   * Runs a roll transition and reports what it did, the runtime decides the transition
   * @param stateBefore - the runtime before the transition, reported as unloaded if the transition loads an event
   * @returns whether the transition ran
   */
  private handleRollTransition(
    stateBefore: Readonly<RuntimeState>,
    transition: () => runtimeState.RollResult,
  ): boolean {
    try {
      const { didLoad, didStart } = transition();
      const newState = runtimeState.getState();

      if (didLoad) {
        logger.info(LogOrigin.Playback, 'Event loaded', eventFields(newState.eventNow));
        emitLifecycle({ cycle: TimerLifeCycle.onLoad, state: newState, unloaded: stateBefore });
      }
      if (didStart) {
        emitLifecycle({ cycle: TimerLifeCycle.onStart, state: newState });
      }
      return true;
    } catch (error) {
      logger.error(LogOrigin.Playback, 'Roll failed', { error: getErrorMessage(error) });
      return false;
    }
  }

  /**
   * @description resume playback state given a restore point
   * @param restorePoint
   */
  @broadcastResult
  public resume(restorePoint: RuntimeRestore) {
    if (restorePoint.rundownId !== getCurrentRundownId()) {
      logger.warning(LogOrigin.Server, 'Restore skipped', { reason: 'other-rundown', rundown: restorePoint.rundownId });
      return;
    }

    runtimeState.setOffsetMode(restorePoint.offsetMode);

    const { selectedEventId, playback } = restorePoint;
    if (playback === Playback.Roll) {
      this.handleRoll();
      return;
    }

    if (!selectedEventId) {
      return;
    }

    // the db would have to change for the event not to exist
    // we do not know the reason for the crash, so we check anyway
    const event = getEntryWithId(selectedEventId);
    if (!isOntimeEvent(event) || !isPlayableEvent(event)) {
      logger.warning(LogOrigin.Server, 'Restore skipped', { reason: 'event-not-playable', id: selectedEventId });
      return;
    }

    const rundown = getCurrentRundown();
    const metadata = getRundownMetadata();
    runtimeState.resume(restorePoint, event, rundown, metadata);

    logger.info(LogOrigin.Playback, 'Playback resumed', { state: playback, ...eventFields(event) });
  }

  /**
   * Adds time to current event
   * @param {number} time - time to add in milliseconds
   */
  @broadcastResult
  public addTime(time: number) {
    if (runtimeState.addTime(time)) {
      logger.info(LogOrigin.Playback, 'Time adjusted', {
        by: `${time > 0 ? '+' : '-'}${millisToString(Math.abs(time))}`,
      });
    }
  }
}

export const runtimeService = new RuntimeService();

/**
 * Something that happened to playback, with the runtime as it was when it happened
 */
type LifecycleEvent = {
  cycle: TimerLifeCycle;
  /** the runtime the cycle concerns, eg: a finish carries the event which finished */
  state: Readonly<RuntimeState>;
  /** the runtime before the cycle, its event's report entry ends */
  unloaded?: Readonly<RuntimeState>;
};

/**
 * Reports a playback cycle to reports and automations
 * Delivery waits for the current call to finish, so the runtime has committed and broadcast its state,
 * events are delivered once, in the order they were emitted
 * Automations still read the store when the event is delivered, rather than the state it carries
 */
function emitLifecycle({ cycle, state, unloaded }: LifecycleEvent) {
  process.nextTick(() => {
    // a failing consumer must not break playback
    try {
      if (unloaded) {
        triggerReportEntry(TimerLifeCycle.onStop, unloaded);
      }
      if (cycle === TimerLifeCycle.onStart) {
        triggerReportEntry(TimerLifeCycle.onStart, state);
      }
      triggerAutomations(cycle);
    } catch (error) {
      logger.error(LogOrigin.Playback, 'Lifecycle delivery failed', { cycle, error: getErrorMessage(error) });
    }
  });
}

/** identifies an event as users know it, by cue and title, with the id only when both are empty */
function eventFields(event: OntimeEvent | null) {
  if (!event) return {};
  return { cue: event.cue, title: event.title, id: event.cue || event.title ? undefined : event.id };
}

type EntryUpdateKeys = keyof Pick<RuntimeState, 'eventNow' | 'eventNext' | 'eventFlag' | 'groupNow'>;

/**
 * Decorator manages side effects from updating the runtime
 * This should only be applied to functions that are exposed for consumption
 * ie: whenever an external service makes a request, we update the state with the mutation result
 */
function broadcastResult(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (this: RuntimeService, ...args: any[]) {
    // call the original method and get the state
    const result = originalMethod.apply(this, args);
    const state = runtimeState.getState();
    const batch = eventStore.createBatch();

    // we do the comparison by explicitly for each property
    // to apply custom logic for different datasets

    // Update the entry if they have changed
    const eventNowChanged = updateMaybeEntryIfChanged('eventNow');
    const eventNextChanged = updateMaybeEntryIfChanged('eventNext');
    const eventFlagChanged = updateMaybeEntryIfChanged('eventFlag');
    const groupNowChanged = updateMaybeEntryIfChanged('groupNow');
    const entryChanged = eventNowChanged || eventNextChanged || eventFlagChanged || groupNowChanged;

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
      RuntimeService.previousState[key] = currentEntry ? cloneEntryData(currentEntry) : null;
      return true;
    }

    // save the restore state
    if (hasImmediateChanges) {
      restoreService
        .save({
          rundownId: getCurrentRundownId(),
          playback: state.timer.playback,
          selectedEventId: state.eventNow?.id ?? null,
          startedAt: state.timer.startedAt,
          addedTime: state.timer.addedTime,
          pausedAt: state._timer.pausedAt,
          pausedDuration: state._timer.pausedDuration,
          firstStart: state.rundown.actualStart,
          startEpoch: state._startEpoch,
          currentDay: state.rundown.currentDay,
          offsetMode: state.offset.mode,
        })
        .catch((_e) => {
          //we don't do anything with the error here
        });
    }

    batch.send();

    // any mutation may have moved the boundary, so we anticipate it here
    this.timer.scheduleBoundary(runtimeState.getTimeToNextBoundary());
    return result;
  };

  return descriptor;
}
