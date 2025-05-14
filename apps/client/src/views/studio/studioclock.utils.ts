import { secondsInMillis } from 'ontime-utils';

import { formatTime } from '../../common/utils/time';

export function getClockData(clock: number): { seconds: number; display: string; thing: string | undefined } {
  const [display, thing] = (() => {
    const formatted = formatTime(clock);
    if (formatted.endsWith('AM')) {
      return [formatted.slice(0, -2), 'AM'];
    }
    if (formatted.endsWith('PM')) {
      return [formatted.slice(0, -2), 'PM'];
    }
    return [formatted, undefined];
  })();

  return { seconds: secondsInMillis(clock), display, thing };
}
