import { dayInMs } from '../date-utils/conversionUtils.js';

export type EffectiveScheduleItem = {
  timeStart: number;
  timeEnd: number;
  dayOffset?: number;
  baseDelay?: number;
};

export type EffectiveSchedulePoint = {
  delayAtThisPoint: number;
  effectiveStart: number;
  effectiveEnd: number;
};

export function calculatePropagationUntilGap(
  items: EffectiveScheduleItem[],
  activeIndex: number | null,
  globalDelayMs: number,
): number[] {
  const delayByIndex = new Array<number>(items.length).fill(0);
  if (activeIndex === null || globalDelayMs === 0) {
    return delayByIndex;
  }

  if (activeIndex < 0 || activeIndex >= items.length) {
    return delayByIndex;
  }

  let remainingDelay = globalDelayMs;
  delayByIndex[activeIndex] = remainingDelay;

  for (let i = activeIndex + 1; i < items.length; i++) {
    const previous = toAbsoluteWindow(items[i - 1]);
    const current = toAbsoluteWindow(items[i]);
    const gap = current.start - previous.end;

    if (gap > 0 && remainingDelay > 0) {
      remainingDelay = Math.max(remainingDelay - gap, 0);
    } else if (gap > 0 && remainingDelay < 0) {
      remainingDelay = Math.min(remainingDelay + gap, 0);
    }

    delayByIndex[i] = remainingDelay;
    if (remainingDelay === 0) {
      break;
    }
  }

  return delayByIndex;
}

export function calculateEffectiveSchedule(
  items: EffectiveScheduleItem[],
  activeIndex: number | null,
  globalDelayMs: number,
): EffectiveSchedulePoint[] {
  const propagatedDelay = calculatePropagationUntilGap(items, activeIndex, globalDelayMs);

  return items.map((item, index) => {
    const baseDelay = item.baseDelay ?? 0;
    const delayAtThisPoint = propagatedDelay[index];
    const effectiveStart = item.timeStart + baseDelay + delayAtThisPoint;
    const effectiveEnd = item.timeEnd + baseDelay + delayAtThisPoint;

    return {
      delayAtThisPoint,
      effectiveStart,
      effectiveEnd,
    };
  });
}

function toAbsoluteWindow(item: EffectiveScheduleItem): { start: number; end: number } {
  const baseDelay = item.baseDelay ?? 0;
  const dayOffset = (item.dayOffset ?? 0) * dayInMs;
  const start = item.timeStart + dayOffset + baseDelay;

  let end = item.timeEnd + dayOffset + baseDelay;
  if (end < start) {
    end += dayInMs;
  }

  return { start, end };
}
