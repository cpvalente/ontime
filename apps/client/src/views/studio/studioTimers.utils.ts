import { MaybeNumber, OntimeEvent, TimerState } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import { getOffsetText } from '../../common/utils/offset';
import { formatTime } from '../../common/utils/time';

const timeFormat = { format12: 'h:mm a', format24: 'HH:mm' };
export function getFormattedScheduleTimes(
  data: {
    offset: number;
    actualStart: MaybeNumber;
    expectedEnd: MaybeNumber;
  },
  timezoneDelta: number,
) {
  return {
    actualStart: formatTime(data.actualStart, { ...timeFormat, timezoneDelta }),
    expectedEnd: formatTime(data.expectedEnd, { ...timeFormat, timezoneDelta }),
    offset: getOffsetText(data.offset),
  };
}

export function getFormattedEventData(
  eventNow: OntimeEvent | null,
  timer: TimerState,
  mainSource: keyof OntimeEvent | null,
  timezoneDelta: number,
) {
  return {
    title: (eventNow?.[mainSource ?? 'title'] as string) || '-',
    startedAt: formatTime(timer.startedAt, { ...timeFormat, timezoneDelta }),
    expectedEnd: formatTime(timer.expectedFinish, { ...timeFormat, timezoneDelta }),
    timer: millisToString(timer.current),
  };
}
