import { EntryId, MaybeNumber, OffsetMode, OntimeEntry, OntimeEvent, OntimeReport, Playback } from 'ontime-types';
import { getExpectedStart, MILLIS_PER_MINUTE } from 'ontime-utils';

import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import type { TranslationKey } from '../../translation/TranslationProvider';

/**
 * Parses string as a title
 */
export function sanitiseTitle(title: string | null) {
  return title ?? '{no title}';
}

/**
 * Whether the current event is live
 */
export function getIsLive(currentId: EntryId, selectedId: EntryId | null, playback: Playback): boolean {
  return currentId === selectedId && playback !== Playback.Armed;
}

type TimerMessage = Record<string, TranslationKey>;
export type ProgressStatus = 'future' | 'due' | 'live' | 'done';

export const timerProgress: TimerMessage = {
  future: 'countdown.to_start',
  due: 'timeline.due',
  live: 'timeline.live',
  done: 'countdown.ended',
};

/**
 * Returns a parsed timer and relevant status message
 * Handles events in different days but disregards whether an event has actually played
 * TODO: get data from reporter and check if the event has played
 * TODO: get timer data granularly
 */
export function getSubscriptionDisplayData(
  current: MaybeNumber,
  playback: Playback,
  clock: number,
  subscribedEvent: ExtendedEntry<OntimeEvent> & { endedAt: MaybeNumber; expectedStart: number },
): { status: ProgressStatus; timer: MaybeNumber } {
  if (subscribedEvent.isLoaded) {
    // 1. An event that is loaded but not running is {'due': <countdown | overtime>}
    if (playback === Playback.Armed) {
      // if we are following the event, but it is not running, we show the scheduled start
      return { status: 'due', timer: subscribedEvent.timeStart + subscribedEvent.delay };
    }

    // 1. An event that is loaded but not armed can only be live {'live': <countdown | overtime>}
    return { status: 'live', timer: current };
  }

  /**
   * If we are showing expected times we don't have to guess since that assumes a linear playback
   */
  if (subscribedEvent.isPast) {
    return { status: 'done', timer: subscribedEvent.endedAt };
  }
  if (subscribedEvent.expectedStart - clock <= 0) {
    return { status: 'due', timer: subscribedEvent.expectedStart - clock };
  }
  return { status: 'future', timer: subscribedEvent.expectedStart - clock };
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
export function getOrderedSubscriptions<T extends OntimeEntry>(subscriptions: EntryId[], playableEvents: T[]): T[] {
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

export function isOutsideRange(a: number, b: number): boolean {
  return Math.abs(a - b) > MILLIS_PER_MINUTE;
}

export type CountdownEvent = ExtendedEntry<OntimeEvent> & { expectedStart: number; endedAt: MaybeNumber };

export function extendEventData(
  event: ExtendedEntry<OntimeEvent>,
  currentDay: number,
  actualStart: MaybeNumber,
  plannedStart: MaybeNumber,
  offset: number,
  mode: OffsetMode,
  reportData: OntimeReport,
): CountdownEvent {
  const { totalGap, isLinkedToLoaded } = event;
  const expectedStart = getExpectedStart(event, {
    currentDay,
    totalGap,
    actualStart,
    plannedStart,
    isLinkedToLoaded,
    offset,
    mode,
  });
  const { endedAt } = reportData[event.id] ?? { endedAt: null };
  return { ...event, expectedStart, endedAt };
}
