import { formatDelay, formatOverlap } from './EventBlock.utils';

import style from './RundownIndicators.module.scss';

interface RundownIndicatorProps {
  timeStart: number;
  previousStart?: number;
  previousEnd?: number;
  delay: number;
}

export default function RundownIndicators(props: RundownIndicatorProps) {
  const { timeStart, previousStart, previousEnd, delay } = props;

  const hasOverlap = formatOverlap(timeStart, previousStart, previousEnd);
  const hasDelay = formatDelay(timeStart, delay);

  return (
    <div className={style.indicators}>
      {hasDelay && <div className={style.delay}>{hasDelay}</div>}
      {hasOverlap && <div className={style.gap}>{hasOverlap}</div>}
    </div>
  );
}
