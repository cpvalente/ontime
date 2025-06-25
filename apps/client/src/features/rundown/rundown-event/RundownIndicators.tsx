import { formatDelay, formatGap } from './rundownEvent.utils';

import style from './RundownIndicators.module.scss';

interface RundownIndicatorProps {
  timeStart: number;
  isNextDay: boolean;
  delay: number;
  gap: number;
}

export default function RundownIndicators({ timeStart, delay, gap, isNextDay }: RundownIndicatorProps) {
  const hasGap = formatGap(gap, isNextDay);
  const hasDelay = formatDelay(timeStart, delay);

  return (
    <div className={style.indicators}>
      {hasDelay && <div className={style.delay}>{hasDelay}</div>}
      {hasGap && <div className={style.gap}>{hasGap}</div>}
    </div>
  );
}
