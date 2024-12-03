import type { MaybeNumber, RundownCached } from 'ontime-types';
import { isOntimeEvent } from 'ontime-types';

import { dayInMs } from '../date-utils/conversionUtils';

export function calculateExpectedStart(
  rundownCached: RundownCached,
  offset: MaybeNumber,
  clock: number,
  selectedEventIndex: MaybeNumber,
  currentTimer: MaybeNumber,
) {
  if (selectedEventIndex === null || offset === null) {
    // If nothing is selected then it is just the planed starts
    return {};
  }

  const { order, rundown } = rundownCached;
  const expectedStarts: Record<string, { expectedStart: number; timeUntil: number }> = {};

  let eventCounter = 0;
  let previousEnd: MaybeNumber = null;
  let consumedOverTime = Math.min(currentTimer ?? 0, 0);
  let consumedOffset = offset;
  order.forEach((id) => {
    const event = rundown[id];
    if (!isOntimeEvent(event)) {
      return;
    }
    if (eventCounter <= selectedEventIndex) {
      eventCounter++;
      previousEnd = event.timeEnd;
      return;
    }
    eventCounter++;

    const { timeStart, timeEnd } = event;

    const gap = previousEnd === null ? 0 : timeStart - previousEnd;
    if (gap > 0 && consumedOverTime < 0 && consumedOffset < 0) {
      const consume = Math.max(Math.min(gap - (gap + consumedOverTime), 0), gap);
      consumedOffset = Math.min(consumedOffset + consume, 0);
      consumedOverTime = Math.min(consumedOverTime + consume, 0);
    }

    const expectedStart = (timeStart - consumedOffset) % dayInMs;
    const expectedStartDayCorrected = expectedStart < 0 ? dayInMs + expectedStart : expectedStart;
    console.log({ id, clock, timeStart, timeEnd, dayLeft: dayInMs - clock, expectedStart, expectedStartDayCorrected });
    const timeUntil =
      clock > expectedStartDayCorrected
        ? expectedStartDayCorrected + (dayInMs - clock)
        : expectedStartDayCorrected - clock;
    expectedStarts[id] = { expectedStart: expectedStartDayCorrected, timeUntil };

    previousEnd = timeEnd;
  });

  return expectedStarts;
}
