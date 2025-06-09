import { EntryId, MaybeNumber, OntimeEvent, Playback } from 'ontime-types';

import { ViewExtendedTimer } from '../../common/models/TimeManager.type';

export enum TimerMessage {
  ToStart = 'to_start',
  Due = 'due',
  Live = 'live',
  Ended = 'ended',
}

/**
 * Parses string as a title
 */
export const sanitiseTitle = (title: string | null) => (title ? title : '{no title}');

/**
 * Returns a parsed timer and relevant status message
 * Handles events in different days but disregards whether an event has actually played
 * TODO: get data from reporter and check if the event has played
 */
export function getSubscriptionDisplayData(
  time: ViewExtendedTimer,
  follow: OntimeEvent,
  selectedId: EntryId | null,
  offset: number,
  currentDay: number,
  showProjected = false,
): { message: TimerMessage; timer: MaybeNumber } {
  const addedTime = showProjected ? offset : 0;

  if (selectedId === follow.id) {
    // 1. An event that is loaded but not running is {'due': <countdown | overtime>}
    if (time.playback === Playback.Armed) {
      // if we are following the event, but it is not running, we show the armed timer
      return {
        message: TimerMessage.Due,
        timer: follow.timeStart + addedTime,
      };
    }

    // 2. An event with a time-to-start lower than 0 is {'due': <countdown | scheduledStart>}
    return {
      message: TimerMessage.Live,
      timer: time.current,
    };
  }

  /**
   * If the running timer is not the one we are following
   * we can be in future, due or have ended
   */

  // 3. event is the day after
  if (follow.dayOffset > currentDay) {
    return { message: TimerMessage.ToStart, timer: follow.timeStart - time.clock - addedTime };
  }

  // 4. event is the before after, show the scheduled end
  if (follow.dayOffset < currentDay) {
    return { message: TimerMessage.Ended, timer: follow.timeEnd };
  }

  // 5. if event is in future, we count to the scheduled start
  if (time.clock < follow.timeStart) {
    return { message: TimerMessage.ToStart, timer: follow.timeStart - time.clock - addedTime };
  }

  // 6. if event has ended, we count to the scheduled end
  if (time.clock > follow.timeEnd) {
    return { message: TimerMessage.Ended, timer: follow.timeStart - time.clock - addedTime };
  }

  // the event here has to be due
  return { message: TimerMessage.Due, timer: null };
}

/**
 * Adds a set of subscriptions to the URL parameters
 */
export function makeSubscriptionsUrl(urlRef: string, subscriptions: EntryId[]) {
  const url = new URL(urlRef);
  const newParams = new URLSearchParams();

  // copy existing parameters except for 'sub'
  for (const [key, value] of url.searchParams.entries()) {
    if (key !== 'sub') {
      newParams.append(key, value);
    }
  }

  // add new subscriptions
  subscriptions.forEach((id) => {
    newParams.append('sub', id);
  });

  url.search = newParams.toString();

  return url;
}

/**
 * Returns an array of events subscribed events ordered by scheduled
 * Since the original array is already ordered, we simply filter out the events
 * which are not in the subscriptions list.
 */
export function getOrderedSubscriptions(subscriptions: EntryId[], playableEvents: OntimeEvent[]): OntimeEvent[] {
  return playableEvents.filter((event) => subscriptions.includes(event.id));
}

/**
 * Checks through the rundown whether the current event is linked to the loaded event
 */
export function isLinkedToLoadedEvent(events: OntimeEvent[], loadedId: EntryId | null, currentId: EntryId): boolean {
  // if nothing is loaded, we return true to simplify the logic
  if (!loadedId) {
    return true;
  }

  const loadedIndex = events.findIndex((event) => event.id === loadedId);
  if (loadedIndex === -1) {
    return true;
  }

  for (let i = loadedIndex; i < events.length; i++) {
    const event = events[i];
    if (event.id === currentId) {
      return true;
    }

    if (event.linkStart === null) {
      return false;
    }
  }

  return true;
}
