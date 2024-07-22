import { isOntimeEvent, MaybeString, NormalisedRundown, OntimeEvent } from 'ontime-types';
import {
  dayInMs,
  getEventWithId,
  getFirstEvent,
  getFirstEventNormal,
  getLastEventNormal,
  getNextEvent,
  MILLIS_PER_HOUR,
  millisToString,
  removeSeconds,
} from 'ontime-utils';

import { clamp } from '../../../common/utils/math';
import { formatDuration } from '../../../common/utils/time';

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
    timelineSections.push(removeSeconds(millisToString((i % 24) * MILLIS_PER_HOUR)));
  }
  return timelineSections;
}

/**
 * Extracts the timeline sections from a rundown
 */
export function getTimelineSections(rundown: NormalisedRundown, order: string[]): string[] {
  if (order.length === 0) {
    return [];
  }
  const { firstEvent } = getFirstEventNormal(rundown, order);
  const { lastEvent } = getLastEventNormal(rundown, order);
  const firstStart = firstEvent?.timeStart ?? 0;
  const lastEnd = lastEvent?.timeEnd ?? 0;
  const normalisedLastEnd = lastEnd < firstStart ? lastEnd + dayInMs : lastEnd;

  const startHour = getStartHour(firstStart);
  const endHour = getEndHour(normalisedLastEnd);

  const elements = makeTimelineSections(startHour, endHour);
  return elements;
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

type UpcomingEvents = {
  now: OntimeEvent | null;
  next: OntimeEvent | null;
  followedBy: OntimeEvent | null;
};

/**
 * Returns upcoming events from current: now, next and followedBy
 */
export function getUpcomingEvents(events: OntimeEvent[], selectedId: MaybeString): UpcomingEvents {
  if (events.length === 0) {
    return { now: null, next: null, followedBy: null };
  }

  const now = selectedId ? getEventWithId(events, selectedId) : getFirstEvent(events)?.firstEvent;

  if (!isOntimeEvent(now)) {
    return { now: null, next: null, followedBy: null };
  }

  const next = getNextEvent(events, now.id)?.nextEvent;
  const followedBy = next ? getNextEvent(events, next.id)?.nextEvent : null;

  // Return the titles, handling nulls appropriately
  return {
    now,
    next,
    followedBy,
  };
}

export function getFormattedTimeToStart(event: OntimeEvent, now: number, dueText: string): string {
  const timeToStart = event.timeStart - now;

  if (timeToStart < 0) {
    return dueText;
  }

  return `T - ${formatDuration(timeToStart)}`;
}
