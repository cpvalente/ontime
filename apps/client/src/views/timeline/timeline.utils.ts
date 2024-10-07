import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isOntimeEvent, isPlayableEvent, MaybeString, OntimeEvent, OntimeRundown, PlayableEvent } from 'ontime-types';
import {
  dayInMs,
  getEventWithId,
  getFirstEvent,
  getNextEvent,
  getTimeFromPrevious,
  isNewLatest,
  MILLIS_PER_HOUR,
} from 'ontime-utils';

import { clamp } from '../../common/utils/math';
import { formatDuration } from '../../common/utils/time';
import { isStringBoolean } from '../../features/viewers/common/viewUtils';

import type { ProgressStatus } from './TimelineEntry';

type CSSPosition = {
  left: number;
  width: number;
};

/**
 * Calculates the position (in %) of an element relative to a schedule
 */
export function getRelativePositionX(scheduleStart: number, scheduleEnd: number, now: number): number {
  return clamp(((now - scheduleStart) / (scheduleEnd - scheduleStart)) * 100, 0, 100);
}

/**
 * Calculates an absolute position of an element based on a schedule
 */
export function getElementPosition(
  scheduleStart: number,
  scheduleEnd: number,
  eventStart: number,
  eventDuration: number,
  containerWidth: number,
): CSSPosition {
  const normalEnd = scheduleEnd < scheduleStart ? scheduleEnd + dayInMs : scheduleEnd;
  const totalDuration = normalEnd - scheduleStart;
  const width = (eventDuration * containerWidth) / totalDuration;
  const left = ((eventStart - scheduleStart) * containerWidth) / totalDuration;

  return { left, width };
}

/**
 * Gets rounded down hour for a given time
 */
export function getStartHour(startTime: number): number {
  const hours = Math.floor(startTime / MILLIS_PER_HOUR);
  return hours;
}

/**
 * Gets rounded up hour for a given time
 */
export function getEndHour(endTime: number): number {
  const hours = Math.ceil(endTime / MILLIS_PER_HOUR);
  return hours;
}

/**
 * converts a time span into an array of hours
 */
export function makeTimelineSections(firstHour: number, lastHour: number) {
  const timelineSections = [];
  for (let i = firstHour; i < lastHour; i++) {
    timelineSections.push(i);
  }
  return timelineSections;
}

/**
 * Returns a formatted label for a progress status
 */
export function getStatusLabel(timeToStart: number, status: ProgressStatus): string {
  if (status === 'done' || status === 'live') {
    return status;
  }

  if (timeToStart < 0) {
    return 'pending';
  }

  return formatDuration(timeToStart);
}

interface ScopedRundownData {
  scopedRundown: PlayableEvent[];
  firstStart: number;
  totalDuration: number;
}

export function useScopedRundown(rundown: OntimeRundown, selectedEventId: MaybeString): ScopedRundownData {
  const [searchParams] = useSearchParams();

  const data = useMemo(() => {
    if (rundown.length === 0) {
      return { scopedRundown: [], firstStart: 0, totalDuration: 0 };
    }

    const hideBackstage = isStringBoolean(searchParams.get('hideBackstage'));
    const hidePast = isStringBoolean(searchParams.get('hidePast'));

    const scopedRundown: PlayableEvent[] = [];
    let selectedIndex = selectedEventId ? Infinity : -1;
    let firstStart = null;
    let totalDuration = 0;
    let lastEntry: PlayableEvent | null = null;

    for (let i = 0; i < rundown.length; i++) {
      const currentEntry = rundown[i];
      // we only deal with playableEvents
      if (isOntimeEvent(currentEntry) && isPlayableEvent(currentEntry)) {
        if (currentEntry.id === selectedEventId) {
          selectedIndex = i;
        }

        // maybe filter past
        if (hidePast && i < selectedIndex) {
          continue;
        }

        // maybe filter backstage
        if (!currentEntry.isPublic && hideBackstage) {
          continue;
        }

        // add to scopedRundown
        scopedRundown.push(currentEntry);

        /**
         * Derive timers
         * This logic is partially from rundownCache.generate
         * With the addition of deriving the current day offset
         */
        if (firstStart === null) {
          firstStart = currentEntry.timeStart;
        }

        const timeFromPrevious: number = getTimeFromPrevious(
          currentEntry.timeStart,
          lastEntry?.timeStart,
          lastEntry?.timeEnd,
          lastEntry?.duration,
        );

        if (timeFromPrevious === 0) {
          totalDuration += currentEntry.duration;
        } else if (timeFromPrevious > 0) {
          totalDuration += timeFromPrevious + currentEntry.duration;
        } else if (timeFromPrevious < 0) {
          totalDuration += Math.max(currentEntry.duration + timeFromPrevious, 0);
        }
        if (isNewLatest(currentEntry.timeStart, currentEntry.timeEnd, lastEntry?.timeStart, lastEntry?.timeEnd)) {
          lastEntry = currentEntry;
        }
      }
    }

    return { scopedRundown, firstStart: firstStart ?? 0, totalDuration };
  }, [rundown, searchParams, selectedEventId]);

  return data;
}

type UpcomingEvents = {
  now: OntimeEvent | null;
  next: OntimeEvent | null;
  followedBy: OntimeEvent | null;
};

/**
 * Returns upcoming events from current: now, next and followedBy
 */
export function getUpcomingEvents(events: OntimeRundown, selectedId: MaybeString): UpcomingEvents {
  if (events.length === 0) {
    return { now: null, next: null, followedBy: null };
  }

  let now = selectedId ? getEventWithId(events, selectedId) : null;
  if (!isOntimeEvent(now)) {
    now = null;
  }

  const next = now ? getNextEvent(events, now.id)?.nextEvent : getFirstEvent(events).firstEvent;
  const followedBy = next ? getNextEvent(events, next.id)?.nextEvent : null;

  // Return the titles, handling nulls appropriately
  return {
    now,
    next,
    followedBy,
  };
}

/**
 * Utility function calculates time to start
 */
export function getTimeToStart(now: number, start: number, delay: number, offset: number): number {
  return start + delay - now - offset;
}
