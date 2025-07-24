import { EntryId, MaybeNumber, OntimeEvent, Playback, TimerType } from 'ontime-types';
import { dayInMs } from 'ontime-utils';

import { getFormattedTimer } from '../../features/viewers/common/viewUtils';
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

const subscriptionTimerDisplayOptions = {
  removeSeconds: true,
  removeLeadingZero: true,
} as const;

const subscriptionScheduledTimeDisplayOptions = {
  removeSeconds: true,
  removeLeadingZero: false,
} as const;

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
  subscribedEvent: OntimeEvent,
  selectedId: EntryId | null,
  offset: number,
  currentDay: number,
  minutesString: string,
  showExpected = false,
): { status: ProgressStatus; timer: string } {
  const offsetAndDelay = showExpected ? offset + subscribedEvent.delay : 0;

  if (selectedId === subscribedEvent.id) {
    // 1. An event that is loaded but not running is {'due': <countdown | overtime>}
    if (playback === Playback.Armed) {
      // if we are following the event, but it is not running, we show the scheduled start
      return {
        status: 'due',
        timer: getFormattedTimer(
          subscribedEvent.timeStart + offsetAndDelay,
          TimerType.CountDown,
          minutesString,
          subscriptionScheduledTimeDisplayOptions,
        ),
      };
    }

    // 2. An event with a time-to-start lower than 0 is {'due': <countdown | scheduledStart>}, show the running timer
    return {
      status: 'live',
      timer: getFormattedTimer(current, TimerType.CountDown, minutesString, subscriptionTimerDisplayOptions),
    };
  }

  /**
   * If the running timer is not the one we are following
   * we can be in future, due or have ended
   */

  // 3. event is the day after, we show a countdown to start
  if (subscribedEvent.dayOffset > currentDay) {
    const dayOffset = (subscribedEvent.dayOffset - currentDay) * dayInMs;
    return {
      status: 'future',
      timer: getFormattedTimer(
        subscribedEvent.timeStart + dayOffset - clock - offsetAndDelay,
        TimerType.CountDown,
        minutesString,
        subscriptionTimerDisplayOptions,
      ),
    };
  }

  // 4. event is the before after, show the scheduled end
  // TODO: get the time from the reporter
  if (subscribedEvent.dayOffset < currentDay) {
    return {
      status: 'done',
      timer: getFormattedTimer(
        subscribedEvent.timeEnd,
        TimerType.CountDown,
        minutesString,
        subscriptionScheduledTimeDisplayOptions,
      ),
    };
  }

  // 5. if event is in future, we count to the scheduled start
  // TODO: get time until
  if (clock < subscribedEvent.timeStart) {
    return {
      status: 'future',
      timer: getFormattedTimer(
        subscribedEvent.timeStart - clock - offsetAndDelay,
        TimerType.CountDown,
        minutesString,
        subscriptionTimerDisplayOptions,
      ),
    };
  }

  // 6. if event has ended, we show the scheduled end
  // TODO: get the time from the reporter
  if (clock > subscribedEvent.timeEnd) {
    return {
      status: 'done',
      timer: getFormattedTimer(
        subscribedEvent.timeEnd,
        TimerType.CountDown,
        minutesString,
        subscriptionScheduledTimeDisplayOptions,
      ),
    };
  }

  // the event here has to be due, we show the countdown the expected start time
  return {
    status: 'due',
    timer: getFormattedTimer(
      subscribedEvent.timeStart + offsetAndDelay,
      TimerType.CountDown,
      minutesString,
      subscriptionScheduledTimeDisplayOptions,
    ),
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
