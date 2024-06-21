import { isOntimeEvent, MaybeString, NormalisedRundown, OntimeEvent } from 'ontime-types';
import {
  dayInMs,
  getByEventId,
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
 * Estimates the width of an element based on its content
 */
export function getEstimatedWidth(content: string): number {
  // use 8 as minimum width to account for duration string
  // 12 is a rough estimate of the width of a character at 15px font size
  return Math.max(content.length, 8) * 12;
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
  // TODO: events that finish at midnight have lastEnd 0
  const totalDuration = scheduleEnd - scheduleStart;
  const width = (eventDuration * containerWidth) / totalDuration;
  const left = ((eventStart - scheduleStart) * containerWidth) / totalDuration;

  return { left, width };
}

export function getStartHour(startTime: number): number {
  const hours = Math.floor(startTime / MILLIS_PER_HOUR);
  return hours;
}

export function getEndHour(endTime: number): number {
  const hours = Math.ceil(endTime / MILLIS_PER_HOUR);
  return hours;
}

export function makeTimelineSections(firstHour: number, lastHour: number) {
  const timelineSections = [];
  for (let i = firstHour; i < lastHour; i++) {
    timelineSections.push(removeSeconds(millisToString(i * MILLIS_PER_HOUR)));
  }
  return timelineSections;
}

// TODO: account for elapsed days
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

const MAX_DEPTH = 5;

/**
 * Estimates the top offset for an element
 */
export function getLaneLevel(rightMostElements: Record<number, number>, left: number): number {
  for (let checkLane = 0; checkLane < MAX_DEPTH; checkLane++) {
    if (rightMostElements[checkLane] === undefined) {
      return checkLane;
    }
    if (rightMostElements[checkLane] < left) {
      return checkLane;
    }
  }
  return 0;
}

/**
 * Returns a formatted label for a progress status
 */
export function getStatusLabel(timeToStart: number, status: ProgressStatus): string {
  if (status === 'finished' || status === 'live') {
    return status;
  }

  if (timeToStart < 0) {
    return 'T - 0';
  }

  return `T - ${formatDuration(timeToStart)}`;
}

type UpcomingEvents = {
  now: MaybeString;
  next: MaybeString;
  followedBy: MaybeString;
};

/**
 * Returns upcoming events from current: now, next and followedBy
 */
export function getUpcomingEvents(events: OntimeEvent[], selectedId: MaybeString): UpcomingEvents {
  if (events.length === 0) {
    return { now: null, next: null, followedBy: null };
  }

  const nowEvent = selectedId ? getByEventId(events, selectedId) : getFirstEvent(events)?.firstEvent;

  if (!isOntimeEvent(nowEvent)) {
    return { now: null, next: null, followedBy: null };
  }

  const nextEvent = getNextEvent(events, nowEvent.id)?.nextEvent;
  const followedByEvent = nextEvent ? getNextEvent(events, nextEvent.id)?.nextEvent : null;

  // Return the titles, handling nulls appropriately
  return {
    now: nowEvent.title,
    next: nextEvent ? nextEvent.title : null,
    followedBy: followedByEvent ? followedByEvent.title : null,
  };
}
