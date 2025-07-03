import { memo, useMemo } from 'react';

import { formatDelay, formatGap } from './rundownEvent.utils';

import style from './RundownIndicators.module.scss';

interface RundownIndicatorProps {
  timeStart: number;
  isNextDay: boolean;
  delay: number;
  gap: number;
}

function RundownIndicatorsComponent({ timeStart, delay, gap, isNextDay }: RundownIndicatorProps) {
  const hasGap = useMemo(() => formatGap(gap, isNextDay), [gap, isNextDay]);
  const hasDelay = useMemo(() => formatDelay(timeStart, delay), [timeStart, delay]);

  return (
    <div className={style.indicators}>
      {hasDelay && <div className={style.delay}>{hasDelay}</div>}
      {hasGap && <div className={style.gap}>{hasGap}</div>}
    </div>
  );
}
export default memo(RundownIndicatorsComponent);
