import type { MaybeNumber } from 'ontime-types';

import { formatDelay, formatOverlap } from './EventBlock.utils';

import style from './RundownIndicators.module.scss';

interface RundownIndicatorProps {
  timeStart: number;
  overlapOrGap: MaybeNumber;
  delay: number;
}

export default function RundownIndicators(props: RundownIndicatorProps) {
  const { timeStart, delay, overlapOrGap } = props;

  const hasOverlap = formatOverlap(overlapOrGap);
  const hasDelay = formatDelay(timeStart, delay);

  return (
    <div className={style.indicators}>
      {hasDelay && <div className={style.delay}>{hasDelay}</div>}
      {hasOverlap && <div className={style.gap}>{hasOverlap}</div>}
    </div>
  );
}
