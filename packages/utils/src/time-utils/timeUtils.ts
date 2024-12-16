import type { MaybeNumber, RundownCached } from 'ontime-types';
import { isOntimeEvent } from 'ontime-types';

import { dayInMs } from '../date-utils/conversionUtils';

export function calculateExpectedStart(
  rundownCached: RundownCached,
  offset: MaybeNumber,
  clock: number,
  selectedEventIndex: MaybeNumber,
) {
  if (offset === null || selectedEventIndex === null) {
    // If nothing is selected then it is just the planed starts
    return {};
  }

  const { order, rundown } = rundownCached;
  const expectedStarts: Record<
    string,
    { expectedStart: MaybeNumber; expectedEnd: number; timeUntil: MaybeNumber } | null
  > = {};

  let previousExpectedEnd = 0;
  let eventCounter = 0;

  order.forEach((id) => {
    const event = rundown[id];
    if (!isOntimeEvent(event)) {
      return;
    }

    // There are no valid values for previous events
    if (eventCounter < selectedEventIndex) {
      eventCounter++;
      expectedStarts[id] = null;
      return;
    }

    const { timeStart, linkStart, duration, timeEnd } = event;

    // The selected event only has an expected end value
    if (eventCounter === selectedEventIndex) {
      eventCounter++;
      const expectedEnd = (timeEnd - offset) % dayInMs;
      expectedStarts[id] = { expectedStart: null, expectedEnd, timeUntil: null };
      previousExpectedEnd = expectedEnd;
      return;
    }

    // for events that are not linked we assume that the user wants it to start at this exact time
    // but if the previous event will not manage to finis before that we expect it to be pushed out
    if (linkStart === null) {
      const expectedStart = (timeStart < previousExpectedEnd ? previousExpectedEnd : timeStart) % dayInMs;
      const timeUntil = dayCorrectedTimeUntil(clock, expectedStart);
      const expectedEnd = (expectedStart + duration) % dayInMs;
      expectedStarts[id] = { expectedStart, expectedEnd, timeUntil };
      previousExpectedEnd = expectedEnd;
      return;
    }

    //if the event is linked it must always start at the ending time of the previous event
    const expectedStart = previousExpectedEnd;
    const timeUntil = dayCorrectedTimeUntil(clock, expectedStart);
    const expectedEnd = (expectedStart + duration) % dayInMs;
    expectedStarts[id] = { expectedStart, expectedEnd, timeUntil };
    previousExpectedEnd = expectedEnd;
  });

  return expectedStarts;
}

function dayCorrectedTimeUntil(clock: number, expectedStart: number) {
  // return expectedStart - clock;
  return clock <= expectedStart ? expectedStart - clock : expectedStart + (dayInMs - clock);
}
