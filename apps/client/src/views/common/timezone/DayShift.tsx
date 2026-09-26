import { getDayShift } from '../../../common/utils/time';

import style from './Timezone.module.scss';

interface DayShiftProps {
  time: number | null;
  timezoneDelta: number;
}

/**
 * Marks a shifted time that falls on a different day than in show time, eg: +1
 */
export default function DayShift({ time, timezoneDelta }: DayShiftProps) {
  if (time === null) {
    return null;
  }

  const dayShift = getDayShift(time, timezoneDelta);
  if (dayShift === 0) {
    return null;
  }

  return (
    <span className={style.dayShift} data-testid='day-shift'>
      {dayShift > 0 ? `+${dayShift}` : `−${Math.abs(dayShift)}`}
    </span>
  );
}
