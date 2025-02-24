import { OntimeEvent, Runtime, TimerState } from 'ontime-types';
import { millisToString, removeLeadingZero } from 'ontime-utils';

import { formatTime } from '../../common/utils/time';

const timeFormat = { format12: 'h:mm a', format24: 'HH:mm' };
export function getFormattedScheduleTimes(runtime: Runtime) {
  return {
    actualStart: formatTime(runtime.actualStart, timeFormat),
    expectedEnd: formatTime(runtime.expectedEnd, timeFormat),
    offset: removeLeadingZero(millisToString(runtime.offset)),
  };
}

export function getFormattedEventData(eventNow: OntimeEvent | null, timer: TimerState) {
  return {
    title: eventNow?.title || '-',
    startedAt: formatTime(timer.startedAt, timeFormat),
    expectedEnd: formatTime(timer.expectedFinish, timeFormat),
    timer: removeLeadingZero(millisToString(timer.current)),
  };
}
