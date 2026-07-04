import { deepEqual } from 'fast-equals';
import {
  EntryId,
  MaybeNumber,
  Offset,
  OntimeEvent,
  Rundown,
  RuntimeStore,
  TimerState,
  TimerType,
  isOntimeEvent,
  isPlayableEvent,
} from 'ontime-types';
import { millisToSeconds } from 'ontime-utils';

import type { RuntimeState } from '../../stores/runtimeState.js';

export function isNewSecond(
  previousValue: MaybeNumber | undefined,
  currentValue: MaybeNumber | undefined,
  direction: TimerType.CountDown | TimerType.CountUp = TimerType.CountDown,
) {
  return millisToSeconds(currentValue ?? null, direction) !== millisToSeconds(previousValue ?? null, direction);
}

/**
 * Checks whether we should update the clock value
 * - we have rolled into a new seconds unit
 */
export function getShouldClockUpdate(previousUpdate: number, now: number): boolean {
  const newSeconds = millisToSeconds(now, TimerType.CountUp) !== millisToSeconds(previousUpdate, TimerType.CountUp);
  return newSeconds;
}

/**
 * Checks whether we should update the timer values
 * - `current` and `secondaryTimer` trigger on seconds roll over
 * - the rest trigger on any change
 * - `elapsed` and `expectedFinish` is not checked
 */
export function getShouldTimerUpdate(previousValue: TimerState | undefined, currentValue: TimerState): boolean {
  if (previousValue === undefined) return true;
  return (
    // current timer value
    isNewSecond(previousValue.current, currentValue.current) ||
    //secondary timer value, when in pre-roll
    isNewSecond(previousValue.secondaryTimer, currentValue.secondaryTimer) ||
    // other timer values that could have changed
    previousValue.addedTime !== currentValue.addedTime ||
    previousValue.duration !== currentValue.duration ||
    previousValue.phase !== currentValue.phase ||
    previousValue.playback !== currentValue.playback ||
    previousValue.startedAt !== currentValue.startedAt
    // elapsed - this would be the direct invert of current value so no need to check
    // expectedFinish - this will be moved out by the current value going into over time, no need to check
  );
}

/**
 * Checks whether we should update the offset values
 * - `mode` triggers update
 * - `absolute`, `relative`, `expected**End` are ticked with `didDependencyUpdate`
 */
export function getShouldOffsetUpdate(
  previousValue: Offset | undefined,
  currentValue: Offset,
  didDependencyUpdate: boolean,
): boolean {
  if (previousValue === undefined) return true;
  if (previousValue.mode !== currentValue.mode) return true;
  return didDependencyUpdate && !deepEqual(previousValue, currentValue);
}

type EntryUpdateKeys = keyof Pick<RuntimeState, 'eventNow' | 'eventNext' | 'eventFlag' | 'groupNow'>;

/**
 * Diffs a runtime state snapshot against the previously broadcast state
 * and collects the store keys that should be sent to clients
 *
 * !!! mutates previousState in place: emitted keys are persisted so the
 * next diff compares against what clients last received
 */
export function collectRuntimeStateChanges(
  previousState: RuntimeState,
  state: Readonly<RuntimeState>,
): { patch: Partial<RuntimeStore>; hasImmediateChanges: boolean } {
  const patch: Partial<RuntimeStore> = {};

  // we do the comparison by explicitly for each property
  // to apply custom logic for different datasets

  // Update the entry if they have changed
  let entryChanged = false;
  entryChanged ||= updateMaybeEntryIfChanged('eventNow');
  entryChanged ||= updateMaybeEntryIfChanged('eventNext');
  entryChanged ||= updateMaybeEntryIfChanged('eventFlag');
  entryChanged ||= updateMaybeEntryIfChanged('groupNow');

  // for the very fist run there will be nothing in the previousState so we force an update
  const justStarted = !previousState?.timer;

  // offset mode has been changed
  const offsetModeChanged = previousState?.offset?.mode !== state.offset.mode;

  // if playback changes most things should update
  const hasChangedPlayback = previousState.timer?.playback !== state.timer.playback;

  const addedTimeChanged = !justStarted && previousState?.timer.addedTime !== state.timer.addedTime;

  // combine all big changes
  const hasImmediateChanges =
    entryChanged || justStarted || hasChangedPlayback || offsetModeChanged || addedTimeChanged;

  /**
   * if any values have changed.
   * values that have the possibility to tick are updated when the seconds roll over
   */
  const updateTimer = getShouldTimerUpdate(previousState?.timer, state.timer);
  if (updateTimer) {
    patch.timer = state.timer;
    previousState.timer = { ...state.timer };
  }

  /**
   * clock has changed by a second or more.
   * or the timer updated so we ensure that the timer and clock ticks are in sync
   */
  const updateClock = updateTimer || getShouldClockUpdate(previousState.clock, state.clock);
  if (updateClock) {
    patch.clock = state.clock;
    previousState.clock = state.clock;
  }

  /**
   * if any values have changed.
   * values that have the possibility to tick are modulated by `updateClock || hasImmediateChanges`
   */
  const updateRuntime = getShouldOffsetUpdate(previousState?.offset, state.offset, updateClock || hasImmediateChanges);
  if (updateRuntime) {
    patch.offset = state.offset;
    previousState.offset = structuredClone(state.offset);
  }

  /**
   * if any values have changed.
   */
  const updateRundownData = !deepEqual(previousState.rundown, state.rundown);
  if (updateRundownData) {
    patch.rundown = state.rundown;
    previousState.rundown = structuredClone(state.rundown);
  }

  function updateMaybeEntryIfChanged<K extends EntryUpdateKeys>(key: K) {
    const previousEntry = previousState[key];
    const currentEntry = state[key];

    if (!previousEntry && !currentEntry) return false; // if both are null -> skip

    // if they have the same id the check if the contents have changed
    if (previousEntry?.id === currentEntry?.id) {
      if (deepEqual(previousEntry, currentEntry)) return false; // contents are the same -> skip
    }
    // at this point we know that either the id or the contents has changed
    patch[key] = currentEntry as RuntimeStore[K]; // we know that there is the necessary overlap in the types to cast this
    previousState[key] = structuredClone(currentEntry);
    return true;
  }

  return { patch, hasImmediateChanges };
}

/**
 * finds the previous playable event, if it exists
 */
export function findPreviousPlayableId(playableEventsOrder: EntryId[], currentEventId?: string): EntryId | undefined {
  if (!playableEventsOrder.length) {
    return;
  }

  // if there is no event running, go to first
  if (!currentEventId) {
    return getFirstPlayableId(playableEventsOrder);
  }

  const currentIndex = playableEventsOrder.findIndex((eventId) => eventId === currentEventId);

  if (currentIndex < 1) {
    return getFirstPlayableId(playableEventsOrder);
  }

  return playableEventsOrder.at(currentIndex - 1);
}

/**
 * finds the next event playable event, if it exists
 */
export function findNextPlayableId(playableEventsOrder: EntryId[], currentEventId?: string): EntryId | undefined {
  if (!playableEventsOrder.length) {
    return;
  }

  // if there is no event running, go to first
  if (!currentEventId) {
    return getFirstPlayableId(playableEventsOrder);
  }

  const currentIndex = playableEventsOrder.findIndex((eventId) => eventId === currentEventId);
  if (currentIndex === -1 || currentIndex >= playableEventsOrder.length - 1) {
    return getFirstPlayableId(playableEventsOrder);
  }

  return playableEventsOrder.at(currentIndex + 1);
}

/**
 * returns next event that matches a given cue
 * then loops from the start
 */
export function findNextPlayableWithCue(
  rundown: Rundown,
  timedEventsOrder: EntryId[],
  targetCue: string,
  currentEventIndex = 0,
  allowCurrent = false,
): OntimeEvent | undefined {
  const startFromIndex = allowCurrent ? currentEventIndex : currentEventIndex + 1;

  for (let i = startFromIndex; i < timedEventsOrder.length; i++) {
    const eventId = timedEventsOrder[i];
    const event = rundown.entries[eventId];
    if (isOntimeEvent(event) && isPlayableEvent(event) && event.cue === targetCue) {
      return event;
    }
  }

  for (let i = 0; i < startFromIndex; i++) {
    const eventId = timedEventsOrder[i];
    const event = rundown.entries[eventId];
    if (isOntimeEvent(event) && isPlayableEvent(event) && event.cue === targetCue) {
      return event;
    }
  }
}

/**
 * Utility returns the first playable event in rundown, if it exists
 */
export function getFirstPlayableId(playableOrder: EntryId[]): EntryId | undefined {
  return playableOrder.at(0);
}

/**
 * This is a utility function to return an event at a given index
 * It uses the timedEventOrder so that the index is the same as the one in the UI
 */
export function getEventAtIndex(
  rundown: Rundown,
  timedEventOrder: EntryId[],
  eventIndex: number,
): OntimeEvent | undefined {
  const eventId = timedEventOrder[eventIndex];
  if (!eventId) {
    return undefined;
  }

  return rundown.entries[eventId] as OntimeEvent | undefined;
}
