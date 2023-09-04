import { TimerType } from 'ontime-types';
import { formatDisplay } from 'ontime-utils';

import { TimeManagerType } from '../../../common/models/TimeManager.type';
import { formatTime } from '../../../common/utils/time';

const formatOptions = {
  showSeconds: true,
  format: 'hh:mm:ss a',
};

type TimerTypeParams = Pick<TimeManagerType, 'timerType' | 'current' | 'elapsed' | 'clock'>;

export function getTimerByType(timerObject?: TimerTypeParams): string | number | null {
  let timer = null;
  if (!timerObject) {
    return timer;
  }

  if (timerObject.timerType === TimerType.CountDown || timerObject.timerType === TimerType.TimeToEnd) {
    timer = timerObject.current;
  } else if (timerObject.timerType === TimerType.CountUp) {
    timer = timerObject.elapsed;
  } else if (timerObject.timerType === TimerType.Clock) {
    timer = formatTime(timerObject.clock, formatOptions);
  }

  return timer;
}

export function formatTimerDisplay(timer?: string | number | null): string {
  let display = '';

  if (typeof timer === 'string') {
    display = timer;
  } else if (timer === null || typeof timer === 'undefined' || isNaN(timer)) {
    display = '-- : -- : --';
  } else {
    display = formatDisplay(timer, true);
  }

  return display;
}
