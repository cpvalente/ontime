import { millisToSeconds } from 'ontime-utils';
import {
  EntryId,
  GroupState,
  isOntimeEvent,
  isPlayableEvent,
  MaybeNumber,
  OntimeEvent,
  Rundown,
  Runtime,
  TimerState,
  TimerType,
  UpcomingEntry,
} from 'ontime-types';

import { deepEqual } from 'fast-equals';

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
 * this is different from the timer update as it looks at the clock as counting up
 */
export function getShouldClockUpdate(previousUpdate: number, now: number): boolean {
  const newSeconds = millisToSeconds(now, TimerType.CountUp) !== millisToSeconds(previousUpdate, TimerType.CountUp);
  return newSeconds;
}

/**
 * Checks whether we should update the timer value
 * - we have rolled into a new seconds unit
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

export function getShouldRuntimeUpdate(
  previousValue: Runtime | undefined,
  currentValue: Runtime,
  dependentUpdates: boolean,
): boolean {
  if (previousValue === undefined) return true;
  if (dependentUpdates) return !deepEqual(previousValue, currentValue);

  return (
    previousValue.selectedEventIndex !== currentValue.selectedEventIndex ||
    previousValue.numEvents !== currentValue.numEvents ||
    previousValue.plannedStart !== currentValue.plannedStart ||
    previousValue.plannedEnd !== currentValue.plannedEnd ||
    previousValue.actualStart !== currentValue.actualStart ||
    previousValue.actualStart !== currentValue.actualStart ||
    previousValue.offsetMode !== currentValue.offsetMode
    // offsetAbs
    // offsetRel
  );
}

export function getShouldGroupUpdate(
  previousValue: GroupState | null | undefined,
  currentValue: GroupState | null,
  dependentUpdates: boolean,
): boolean {
  if (previousValue === undefined) return true;
  if (dependentUpdates) return !deepEqual(previousValue, currentValue);

  return (
    previousValue?.id !== currentValue?.id || previousValue?.startedAt !== currentValue?.startedAt
    // expectedEnd
  );
}

export function getShouldFlagUpdate(
  previousValue: UpcomingEntry | null | undefined,
  currentValue: UpcomingEntry | null,
  dependentUpdates: boolean,
): boolean {
  if (previousValue === undefined) return true;
  if (dependentUpdates) return !deepEqual(previousValue, currentValue);

  return (
    previousValue?.id !== currentValue?.id
    // expectedStart
  );
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
  playableEventsOrder: EntryId[],
  targetCue: string,
  currentEventIndex = 0,
): OntimeEvent | undefined {
  const lowerCaseCue = targetCue.toLowerCase();

  for (let i = currentEventIndex; i < playableEventsOrder.length; i++) {
    const eventId = playableEventsOrder[i];
    const event = rundown.entries[eventId];
    if (isOntimeEvent(event) && isPlayableEvent(event) && event.cue.toLowerCase() === lowerCaseCue) {
      return event;
    }
  }

  for (let i = 0; i < currentEventIndex; i++) {
    const eventId = playableEventsOrder[i];
    const event = rundown.entries[eventId];
    if (isOntimeEvent(event) && isPlayableEvent(event) && event.cue.toLowerCase() === lowerCaseCue) {
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
