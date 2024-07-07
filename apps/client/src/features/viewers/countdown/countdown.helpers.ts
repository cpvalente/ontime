import { OntimeEvent, Playback } from 'ontime-types';

import { ViewExtendedTimer } from '../../../common/models/TimeManager.type';
import { formatTime } from '../../../common/utils/time';
import { isStringBoolean } from '../common/viewUtils';

export enum TimerMessage {
  toStart = 'to_start',
  waiting = 'waiting',
  running = 'running',
  ended = 'ended',
  unhandled = '',
}

/**
 * Parses string as a title
 */
export const sanitiseTitle = (title: string | null) => (title ? title : '{no title}');

/**
 * Returns a parsed timer and relevant status message
 */
export const fetchTimerData = (
  time: ViewExtendedTimer,
  follow: OntimeEvent | null,
  selectedId: string | null,
  offset: number,
): { message: TimerMessage; timer: number } => {
  if (follow === null) {
    return { message: TimerMessage.unhandled, timer: 0 };
  }

  if (selectedId === follow.id) {
    // if it is selected, it may not be running
    return {
      message: time.playback === Playback.Pause ? TimerMessage.waiting : TimerMessage.running,
      timer: time.current ?? 0,
    };
  }

  const showProjected = getShouldShowProjected();
  const addedTime = showProjected ? offset : 0;
  if (time.clock < follow.timeStart) {
    // if it hasnt started, we count to start
    return { message: TimerMessage.toStart, timer: follow.timeStart - time.clock - addedTime };
  }

  if (follow.timeStart <= time.clock && time.clock <= follow.timeEnd) {
    // if it has started, we show running timer
    return { message: TimerMessage.waiting, timer: time.current ?? 0 };
  }

  // running timer timer is not the one we are following

  // ends day after
  if (follow.timeStart > follow.timeEnd) {
    if (follow.timeStart > time.clock) {
      // if it hasnt started, we count to start
      return { message: TimerMessage.toStart, timer: follow.timeStart - time.clock - addedTime };
    }
    if (follow.timeStart <= time.clock) {
      // if it has started, we show running timer
      return { message: TimerMessage.waiting, timer: time.current ?? 0 };
    }
    // if it has ended, we show how long ago
    return { message: TimerMessage.ended, timer: follow.timeEnd };
  }

  // if it has ended, we show how long ago
  return { message: TimerMessage.ended, timer: follow.timeEnd };
};

/**
 * Gets values for the timer items
 */
export function getTimerItems(start: number | undefined, end: number | undefined, delay: number, offset: number) {
  if (start == null || end == null) {
    return {
      scheduledStart: '',
      scheduledEnd: '',
      projectedStart: '',
      projectedEnd: '',
    };
  }

  const showProjected = getShouldShowProjected();
  const scheduledStart = formatTime(start + delay);
  const scheduledEnd = formatTime(end + delay);
  const projectedStart = showProjected ? formatTime(start + delay - offset) : '';
  const projectedEnd = showProjected ? formatTime(end + delay - offset) : '';

  return {
    scheduledStart,
    scheduledEnd,
    projectedStart,
    projectedEnd,
  };
}

/**
 * Gets from the URL whether the showProjected option is active
 */
function getShouldShowProjected() {
  const params = new URL(document.location.href).searchParams;
  return isStringBoolean(params.get('showProjected'));
}
