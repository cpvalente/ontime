import { secondsInMillis } from 'ontime-utils';

import { formatTime } from '../../common/utils/time';

/**
 * Gathers display elements for the large studio clock
 */
export function getLargeClockData(clock: number) {
  const [display, meridian] = (() => {
    const formatted = formatTime(clock);
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
