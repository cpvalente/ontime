import { MaybeNumber, OntimeEvent, TimerState } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import { getOffsetText } from '../../common/utils/offset';
import { formatTime } from '../../common/utils/time';

const timeFormat = { format12: 'h:mm a', format24: 'HH:mm' };
export function getFormattedScheduleTimes(data: {
  offset: number;
  actualStart: MaybeNumber;
  expectedEnd: MaybeNumber;
}) {
  return {
    actualStart: formatTime(data.actualStart, timeFormat),
    expectedEnd: formatTime(data.expectedEnd, timeFormat),
    offset: getOffsetText(data.offset),
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
