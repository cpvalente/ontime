import { OntimeEvent, Runtime, TimerState } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import { getOffsetText } from '../../common/utils/offset';
import { formatTime } from '../../common/utils/time';

const timeFormat = { format12: 'h:mm a', format24: 'HH:mm' };
export function getFormattedScheduleTimes(runtime: Runtime) {
  const correctedOffset = runtime.offset !== null ? runtime.offset * -1 : null;
  return {
    actualStart: formatTime(runtime.actualStart, timeFormat),
    expectedEnd: formatTime(runtime.expectedEnd, timeFormat),
    offset: getOffsetText(correctedOffset),
  };
}

export function getFormattedEventData(eventNow: OntimeEvent | null, timer: TimerState) {
  return {
    title: eventNow?.title || '-',
    startedAt: formatTime(timer.startedAt, timeFormat),
    expectedEnd: formatTime(timer.expectedFinish, timeFormat),
    timer: millisToString(timer.current),
  };
}
