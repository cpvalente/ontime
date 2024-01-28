import { millisToString, removeLeadingZero, removeTrailingZero } from 'ontime-utils';

import style from './RundownIndicators.module.scss';

interface RundownIndicatorProps {
  timeStart: number;
  previousEnd: number | null;
  delay: number;
}

function formatDelay(timeStart: number, delay: number): string | undefined {
  if (!delay) return;

  const delayedStart = Math.max(0, timeStart + delay);
  const timeTag = removeTrailingZero(millisToString(delayedStart));
  return `New start: ${timeTag}`;
}

function formatOverlap(previousEnd: number | null, timeStart: number): string | undefined {
  if (previousEnd === null) return;

  const overlap = previousEnd - timeStart;
  if (overlap === 0) return;

  const overlapString = removeLeadingZero(millisToString(Math.abs(overlap)));

  return `${overlap > 0 ? 'Overlap' : 'Gap'} ${overlapString}`;
}

export default function RundownIndicators(props: RundownIndicatorProps) {
  const { timeStart, previousEnd, delay } = props;

  const hasOverlap = formatOverlap(previousEnd, timeStart);
  const hasDelay = formatDelay(timeStart, delay);

  return (
    <div className={style.indicators}>
      {hasDelay && <div className={style.delay}>{hasDelay}</div>}
      {hasOverlap && <div className={style.gap}>{hasOverlap}</div>}
    </div>
  );
}
