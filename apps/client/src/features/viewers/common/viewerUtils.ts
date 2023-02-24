import { TimerType } from 'ontime-types';

import { TimeManagerType } from '../../../common/models/TimeManager.type';

type TimerTypeParams = Pick<TimeManagerType, 'timerType' | 'current' | 'elapsed' | 'clock'>;

export function getTimerByType(timerObject?: TimerTypeParams): number | null {
  let timer = null;
  if (!timerObject) {
    return timer;
  }

  if (timerObject.timerType === TimerType.CountDown) {
    timer = timerObject.current;
  } else if (timerObject.timerType === TimerType.CountUp) {
    timer = timerObject?.elapsed ?? 0;
  } else if (timerObject.timerType === TimerType.Clock) {
    timer = timerObject.clock;
  }

  return timer;
}
