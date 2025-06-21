import { millisToSeconds } from 'ontime-utils';
import { EntryId, isOntimeEvent, isPlayableEvent, MaybeNumber, OntimeEvent, Rundown, TimerType } from 'ontime-types';

import { timerConfig } from '../../setup/config.js';

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
export function getShouldTimerUpdate(previousValue: MaybeNumber, currentValue: MaybeNumber): boolean {
  const shouldUpdateTimer = millisToSeconds(currentValue) !== millisToSeconds(previousValue);
  return shouldUpdateTimer;
}

/**
 * In some cases we want to force an update to the timer
 * - if the clock has slid back
 * - if we have escaped the update rate (clock slid forward)
 * - if we are not playing then there is no need to update the timer
 */
export function getForceUpdate(previousUpdate: number, now: number): boolean {
  const isClockBehind = now < previousUpdate;
  const hasExceededRate = now - previousUpdate >= timerConfig.notificationRate;
  return isClockBehind || hasExceededRate;
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
 * returns first event that matches a given cue
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
