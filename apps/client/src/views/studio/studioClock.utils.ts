import { secondsInMillis } from 'ontime-utils';

import { formatTime } from '../../common/utils/time';

/**
 * Gathers display elements for the large studio clock
 */
export function getLargeClockData(clock: number, timeformat: string | null) {
  const [display, meridian] = (() => {
    const formatted = formatTime(clock, { override: timeformat });
    if (formatted.endsWith('AM')) {
      return [formatted.slice(0, -2), 'AM'];
    }
    if (formatted.endsWith('PM')) {
      return [formatted.slice(0, -2), 'PM'];
    }
    return [formatted, undefined];
  })();

  return { seconds: secondsInMillis(clock), display, meridian };
}
