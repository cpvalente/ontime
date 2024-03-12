import { MaybeNumber } from 'ontime-types';
import { millisToString, removeLeadingZero, removeTrailingZero } from 'ontime-utils';

export function formatDelay(timeStart: number, delay: number): string | undefined {
  if (!delay) return;

  const delayedStart = Math.max(0, timeStart + delay);

  const timeTag = removeTrailingZero(millisToString(delayedStart));
  return `New start ${timeTag}`;
}

export function formatOverlap(
  previousStart: MaybeNumber,
  previousEnd: MaybeNumber,
  timeStart: number,
  timeEnd: number,
): string | undefined {
  if (previousEnd === null) return;

  const overlap = previousEnd - timeStart;
  if (overlap === 0) return;

  if (previousStart && timeStart < previousEnd) {
    const overlap = timeEnd - previousStart;
    if (overlap <= 0) return;

    const overlapString = removeLeadingZero(millisToString(Math.abs(overlap)));
    return `Overlap ${overlapString}`;
  }

  const overlapString = removeLeadingZero(millisToString(Math.abs(overlap)));
  return `${overlap > 0 ? 'Overlap' : 'Gap'} ${overlapString}`;
}
