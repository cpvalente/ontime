import { TimerType } from 'ontime-types';

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

  if (timerObject.timerType === TimerType.CountDown) {
    timer = timerObject.current;
  } else if (timerObject.timerType === TimerType.CountUp) {
    timer = timerObject?.elapsed ?? 0;
  } else if (timerObject.timerType === TimerType.Clock) {
    timer = formatTime(timerObject.clock, formatOptions);
  }

  return timer;
}
