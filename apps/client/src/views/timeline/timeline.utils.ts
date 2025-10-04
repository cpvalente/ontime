import { useMemo } from 'react';
import { isOntimeEvent, isPlayableEvent, MaybeString, OntimeEntry, OntimeEvent, PlayableEvent } from 'ontime-types';
import {
  dayInMs,
  getEventWithId,
  getFirstEvent,
  getNextEvent,
  getTimeFrom,
  isNewLatest,
  MILLIS_PER_HOUR,
} from 'ontime-utils';

import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import { formatDuration } from '../../common/utils/time';

import { useTimelineOptions } from './timeline.options';
import type { ProgressStatus } from './TimelineEntry';

type CSSPosition = {
  left: number;
  width: number;
};

/**
 * Calculates the base position and width of an element based on schedule
 * The scaling of these values (if needed) is handled by calculateTimelineLayout
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

  // Calculate proportional width and position
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

  if (timeToStart <= 0) {
    return 'pending';
  }

  return formatDuration(timeToStart);
}

interface ScopedRundownData {
  scopedRundown: ExtendedEntry<PlayableEvent>[];
  firstStart: number;
  totalDuration: number;
}

export function useScopedRundown(
  rundown: ExtendedEntry<OntimeEntry>[],
  selectedEventId: MaybeString,
): ScopedRundownData {
  const { hidePast } = useTimelineOptions();

  const data = useMemo(() => {
    if (rundown.length === 0) {
      return { scopedRundown: [], firstStart: 0, totalDuration: 0 };
    }

    const scopedRundown: ExtendedEntry<PlayableEvent>[] = [];
    let selectedIndex = selectedEventId ? Infinity : -1;
    let firstStart = null;
    let totalDuration = 0;
    let lastEntry: ExtendedEntry<PlayableEvent> | null = null;

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

        const timeFromPrevious: number = getTimeFrom(currentEntry, lastEntry);

        if (timeFromPrevious === 0) {
          totalDuration += currentEntry.duration;
        } else if (timeFromPrevious > 0) {
          totalDuration += timeFromPrevious + currentEntry.duration;
        } else if (timeFromPrevious < 0) {
          totalDuration += Math.max(currentEntry.duration + timeFromPrevious, 0);
        }
        if (isNewLatest(currentEntry, lastEntry)) {
          lastEntry = currentEntry;
        }
      }
    }

    return { scopedRundown, firstStart: firstStart ?? 0, totalDuration };
  }, [hidePast, rundown, selectedEventId]);

  return data;
}

type UpcomingEvents = {
  now: ExtendedEntry<OntimeEvent> | null;
  next: ExtendedEntry<OntimeEvent> | null;
  followedBy: ExtendedEntry<OntimeEvent> | null;
};

/**
 * Returns upcoming events from current: now, next and followedBy
 */
export function getUpcomingEvents(events: ExtendedEntry<PlayableEvent>[], selectedId: MaybeString): UpcomingEvents {
  if (events.length === 0) {
    return { now: null, next: null, followedBy: null };
  }

  let now = selectedId ? (getEventWithId(events, selectedId) as ExtendedEntry<OntimeEvent>) : null;
  if (!isOntimeEvent(now)) {
    now = null;
  }

  const next = now
    ? (getNextEvent(events, now.id)?.nextEvent as ExtendedEntry<OntimeEvent> | null)
    : (getFirstEvent(events).firstEvent as ExtendedEntry<OntimeEvent> | null);
  const followedBy = next ? (getNextEvent(events, next.id)?.nextEvent as ExtendedEntry<OntimeEvent> | null) : null;

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
  return start + delay - now + offset;
}

interface TimelineLayout {
  positions: CSSPosition[];
  scale: number;
  totalWidth: number;
}

/**
 * Calculates positions for all events and applies scaling if needed
 */
export function calculateTimelineLayout(
  events: Array<{ start: number; duration: number }>,
  scheduleStart: number,
  scheduleEnd: number,
  containerWidth: number,
  canScroll: boolean,
  minWidth = 100,
): TimelineLayout {
  // Calculate positions and track minimum width
  let smallestWidth = Infinity;
  const positions = events.map(({ start, duration }) => {
    const position = getElementPosition(scheduleStart, scheduleEnd, start, duration, containerWidth);
    smallestWidth = Math.min(smallestWidth, position.width);
    return position;
  });

  if (!canScroll) {
    return {
      positions: positions,
      scale: 1,
      totalWidth: containerWidth,
    };
  }

  // Determine if scaling is needed
  const scale = smallestWidth < minWidth ? minWidth / smallestWidth : 1;

  // If no scaling is needed, return base positions
  if (scale === 1) {
    return {
      positions,
      scale: 1,
      totalWidth: containerWidth,
    };
  }

  // Apply scale to all positions
  const scaledPositions = positions.map((pos) => ({
    left: pos.left * scale,
    width: pos.width * scale,
  }));

  return {
    positions: scaledPositions,
    scale,
    totalWidth: containerWidth * scale,
  };
}
