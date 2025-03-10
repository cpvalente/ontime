import { secondsInMillis } from 'ontime-utils';

import { formatTime } from '../../common/utils/time';

export function getFormattedTime(clock: number) {
  return {
    seconds: secondsInMillis(clock),
    formatted: formatTime(clock),
  };
}
