import { MaybeNumber, OffsetMode, OntimeEvent } from 'ontime-types';
import { dayInMs } from './conversionUtils';

/**
 * @param currentDay the day offset of the currently running event
 * @param totalGap accumulated gap from the current event
 * @param isLinkedToLoaded is this event part of a chain linking back to the current loaded event
 * @param clock
 * @param offset
 * @returns
 */
export function calculateTimeUntilStart(
  data: Pick<OntimeEvent, 'timeStart' | 'dayOffset' | 'delay'> & {
    currentDay: number;
    totalGap: number;
    isLinkedToLoaded: boolean;
    clock: number;
    offset: number;
    offsetMode: OffsetMode;
    actualStart: MaybeNumber;
    plannedStart: MaybeNumber;
  },
): number {
  const {
    timeStart,
    dayOffset,
    currentDay,
    totalGap,
    isLinkedToLoaded,
    clock,
    offset,
    delay,
    offsetMode,
    actualStart,
    plannedStart,
  } = data;

  //How many days from the currently running event to this one
  const relativeDayOffset = dayOffset - currentDay;

  const delayedStart = Math.max(0, timeStart + delay);

  //The normalised start time of this event relative to the currently running event
  const normalisedTimeStart = delayedStart + relativeDayOffset * dayInMs;

  let relativeStartOffset = 0;

  if (offsetMode === OffsetMode.Relative) {
    relativeStartOffset = (actualStart ?? 0) - (plannedStart ?? 0);
  }

  const scheduledTimeUntil = normalisedTimeStart - clock + relativeStartOffset;

  const offsetTimeUntil = scheduledTimeUntil - offset;

  if (isLinkedToLoaded) {
    //if we are directly linked back to the loaded event we just follow the offset
    return offsetTimeUntil;
  }

  const gapsCanCompensateForOffset = totalGap + offset >= 0;
  if (gapsCanCompensateForOffset) {
    // if we are ahead of schedule or the gap can compensate for the amount we are behind then expect to start at the scheduled time
    return scheduledTimeUntil;
  }

  // otherwise consume as much of the offset as possible with the gap
  const offsetTimeUntilBufferedByGaps = offsetTimeUntil - totalGap;
  return offsetTimeUntilBufferedByGaps;
}
