import { TimerType } from 'ontime-types';

import type { TimeManagerType } from '../../../common/models/TimeManager.type';

type TimerTypeParams = Pick<TimeManagerType, 'timerType' | 'current' | 'elapsed' | 'clock'>;

export function getTimerByType(timerObject?: TimerTypeParams): number | null {
  if (!timerObject) {
    return null;
  }

  switch (timerObject.timerType) {
    case TimerType.CountDown:
    case TimerType.TimeToEnd:
      return timerObject.current;
    case TimerType.CountUp:
      return Math.abs(timerObject.elapsed ?? 0);
    case TimerType.Clock:
      return timerObject.clock;
    default: {
      const exhaustiveCheck: never = timerObject.timerType;
      return exhaustiveCheck;
    }
  }
}

/**
 * Receives a string such as 00:10:10 and removes the hours field if it is 00
 * @param timer
 */
export const removePrefixZeroes = (timer: string): string => {
  if (timer.startsWith('00:0')) {
    return timer.slice(4);
  }
  if (timer.startsWith('00:')) {
    return timer.slice(3);
  }
  return timer;
};

/**
 * Receives a string such as 00:10:00 and removes the seconds field if it is 00
 * @param timer
 */
export const removePostZeroes = (timer: string): string => {
  if (timer.endsWith(':00')) {
    return timer.slice(0, -3);
  }
  
  return timer;
};
