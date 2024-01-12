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
