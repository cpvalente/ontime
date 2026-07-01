import {
  EntryId,
  MaybeNumber,
  OffsetMode,
  OntimeEntry,
  OntimeEvent,
  OntimeGroup,
  OntimeReport,
  Playback,
  PlayableEvent,
  isOntimeEvent,
  isOntimeGroup,
  isPlayableEvent,
} from 'ontime-types';
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

/**
 * A subscription target normalised to the event-shaped object the countdown display consumes.
 * For events this is a pass-through; for groups it carries the group identity and display data
 * while deriving timing from the group's first playable child (see resolveSubscriptionTarget).
 */
export type CountdownTarget = ExtendedEntry<OntimeEvent> & {
  isGroup?: boolean;
  reportId?: EntryId; // entry used for the report lookup (e.g. last child of a group)
  liveEntry?: ExtendedEntry<OntimeEvent> | null; // the running child while a group is live
};

export type CountdownEvent = CountdownTarget & { expectedStart: number; endedAt: MaybeNumber };

/**
 * Resolves a subscription (event or group) into an event-shaped countdown target.
 * - Events are returned unchanged.
 * - Groups count down to their first playable child while displaying the group identity.
 *   Status is group-aware: live while any child is loaded, past only once the whole group has finished.
 * Returns null when a group has no playable children (nothing to count down to).
 */
export function resolveSubscriptionTarget(
  entry: ExtendedEntry<OntimeEvent | OntimeGroup>,
  flatRundown: ExtendedEntry<OntimeEntry>[],
): CountdownTarget | null {
  if (!isOntimeGroup(entry)) {
    return entry;
  }

  const children = flatRundown.filter(
    (item): item is ExtendedEntry<PlayableEvent> =>
      isOntimeEvent(item) && isPlayableEvent(item) && item.parent === entry.id,
  );

  if (children.length === 0) {
    return null;
  }

  const firstChild = children[0];
  const lastChild = children[children.length - 1];
  const liveEntry = children.find((child) => child.isLoaded) ?? null;
  const isLoaded = liveEntry !== null;
  const isPast = !isLoaded && lastChild.isPast;

  return {
    // timing derives from the first playable child
    ...firstChild,
    // group identity and display data
    id: entry.id,
    title: entry.title,
    colour: entry.colour,
    note: entry.note,
    custom: entry.custom,
    duration: entry.duration,
    countToEnd: false,
    // group-aware status
    isLoaded,
    isPast,
    // group markers
    isGroup: true,
    reportId: lastChild.id,
    liveEntry,
  };
}

export function extendEventData(
  event: CountdownTarget,
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
  const { endedAt } = reportData[event.reportId ?? event.id] ?? { endedAt: null };
  return { ...event, expectedStart, endedAt };
}
