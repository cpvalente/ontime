import { OntimeEvent, Runtime, TimerState, ViewSettings } from 'ontime-types';

import { formatTime } from '../../common/utils/time';

export function getFormattedScheduleTimes(runtime: Runtime) {
  return {
    plannedStart: formatTime(runtime.plannedStart),
    plannedEnd: formatTime(runtime.plannedEnd),
    actualStart: formatTime(runtime.actualStart),
    expectedEnd: formatTime(runtime.expectedEnd),
    offset: formatTime(runtime.offset),
  };
}

export function getFormattedEventData(eventNow: OntimeEvent | null, timer: TimerState) {
  return {
    title: eventNow?.title || '-',
    startedAt: formatTime(timer.startedAt),
    expectedEnd: formatTime(timer.expectedFinish),
    timer: formatTime(timer.current),
  };
}
