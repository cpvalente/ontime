import { EntryId, MaybeNumber, OffsetMode, OntimeEntry, OntimeEvent, OntimeReport, Playback } from 'ontime-types';
import { MILLIS_PER_MINUTE, getExpectedStart, millisToString, removeLeadingZero } from 'ontime-utils';

import { useCountdownSocket } from '../../common/hooks/useSocket';
import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import { formatDuration, formatTime } from '../../common/utils/time';
import { type TranslationKey, useTranslation } from '../../translation/TranslationProvider';

/**
 * Parses string as a title
 */
export function sanitiseTitle(title: string | null) {
  return title ?? '{no title}';
}

export const preferredFormat12 = 'h:mm a';
export const preferredFormat24 = 'HH:mm';

/**
 * Whether the current event is live
 */
export function getIsLive(currentId: EntryId, selectedId: EntryId | null, playback: Playback): boolean {
  return currentId === selectedId && playback !== Playback.Armed;
}

export type ProgressStatus = 'future' | 'due' | 'live' | 'done' | 'pending' | 'loaded';
type TimerMessage = Record<ProgressStatus, TranslationKey>;

export const timerProgress: TimerMessage = {
  future: 'countdown.to_start',
  due: 'timeline.due',
  live: 'countdown.running',
  pending: 'countdown.waiting',
  loaded: 'countdown.loaded',
  done: 'countdown.ended',
};

/**
 * Returns a parsed timer and relevant status message
 * Handles events in different days but disregards whether an event has actually played
 */
export function useSubscriptionDisplayData(
  subscribedEvent: ExtendedEntry<OntimeEvent> & { endedAt: MaybeNumber; expectedStart: number },
): { status: ProgressStatus; statusDisplay: string; timeDisplay: string } {
  const { playback, current, clock } = useCountdownSocket();
  const { getLocalizedString } = useTranslation();

  const bigDuration = (value: number) => {
    if (value <= 0) return getLocalizedString('countdown.overtime').toUpperCase();
    if (value < MILLIS_PER_MINUTE * 10) {
      return removeLeadingZero(millisToString(value));
    }

    return formatDuration(value, value > MILLIS_PER_MINUTE * 10)
      .replace('m', `${getLocalizedString('common.minutes')} `)
      .replace('s', getLocalizedString('common.seconds'));
  };

  if (subscribedEvent.isLoaded) {
    if (playback === Playback.Armed) {
      return {
        status: 'loaded',
        statusDisplay: getLocalizedString(timerProgress['loaded']),
        timeDisplay: bigDuration(subscribedEvent.duration),
      };
    }

    return {
      status: 'live',
      statusDisplay: getLocalizedString(timerProgress['live']),
      timeDisplay: bigDuration(current ?? 0),
    };
  }

  if (playback === Playback.Stop || playback === Playback.Armed) {
    return {
      status: 'pending',
      statusDisplay: getLocalizedString(timerProgress['pending']),
      timeDisplay: ' ',
    };
  }

  if (subscribedEvent.isPast) {
    return {
      status: 'done',
      statusDisplay: getLocalizedString(timerProgress['done']),
      timeDisplay: formatTime(subscribedEvent.endedAt, { format12: preferredFormat12, format24: preferredFormat24 }),
    };
  }

  if (subscribedEvent.expectedStart - clock <= 0) {
    return {
      status: 'due',
      statusDisplay: getLocalizedString(timerProgress['future']), // We use future here on purpose for the look of it
      timeDisplay: getLocalizedString(timerProgress['due']).toUpperCase(),
    };
  }

  return {
    status: 'future',
    statusDisplay: getLocalizedString(timerProgress['future']),
    timeDisplay: bigDuration(subscribedEvent.expectedStart - clock),
  };
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
