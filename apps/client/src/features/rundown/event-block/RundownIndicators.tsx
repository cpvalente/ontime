import type { MaybeNumber } from 'ontime-types';

import { formatDelay, formatGap } from './EventBlock.utils';

import style from './RundownIndicators.module.scss';

interface RundownIndicatorProps {
  timeStart: number;
  gapTime: MaybeNumber;
  delay: number;
  isNextDay: boolean;
}

export default function RundownIndicators(props: RundownIndicatorProps) {
  const { timeStart, delay, gapTime, isNextDay } = props;

  const hasOverlap = formatGap(gapTime, isNextDay);
  const hasDelay = formatDelay(timeStart, delay);

  return (
    <div className={style.indicators}>
      {hasDelay && <div className={style.delay}>{hasDelay}</div>}
      {hasOverlap && <div className={style.gap}>{hasOverlap}</div>}
    </div>
  );
}
