import type { OntimeEventReport, OntimeReport, PlayableEvent } from 'ontime-types';
import { dayInMs, MILLIS_PER_HOUR, MILLIS_PER_MINUTE } from 'ontime-utils';

import { makeOntimeEvent, makeRundown } from '../../rundown/__mocks__/rundown.mocks.js';
import { getActualShowTimes, getPlannedShowDuration } from '../report.utils.js';

function makeReport(patch: Partial<OntimeEventReport>): OntimeEventReport {
  return {
    startedAt: 0,
    startedAtDay: 0,
    endedAt: 0,
    endedAtDay: 0,
    scheduledStart: 0,
    scheduledDay: 0,
    scheduledDuration: 0,
    ...patch,
  };
}

describe('getActualShowTimes()', () => {
  it('preserves long gaps within the same day', () => {
    const report: OntimeReport = {
      morning: makeReport({ startedAt: 6 * MILLIS_PER_HOUR, endedAt: 7 * MILLIS_PER_HOUR }),
      evening: makeReport({ startedAt: 20 * MILLIS_PER_HOUR, endedAt: 21 * MILLIS_PER_HOUR }),
    };

    expect(getActualShowTimes(report)).toEqual({
      actualStart: 6 * MILLIS_PER_HOUR,
      actualEnd: 21 * MILLIS_PER_HOUR,
      actualDuration: 15 * MILLIS_PER_HOUR,
    });
  });

  it('orders events by their captured day across midnight', () => {
    const report: OntimeReport = {
      beforeMidnight: makeReport({
        startedAt: dayInMs - 10 * MILLIS_PER_MINUTE,
        endedAt: dayInMs - 5 * MILLIS_PER_MINUTE,
      }),
      afterMidnight: makeReport({
        startedAt: 0,
        startedAtDay: 1,
        endedAt: 10 * MILLIS_PER_MINUTE,
        endedAtDay: 1,
      }),
    };

    expect(getActualShowTimes(report).actualDuration).toBe(20 * MILLIS_PER_MINUTE);
  });
});

it('derives planned duration from playable, non-skipped events', () => {
  const first = makeOntimeEvent({
    id: 'first',
    dayOffset: 0,
    timeStart: 23 * MILLIS_PER_HOUR,
    duration: MILLIS_PER_HOUR,
  }) as PlayableEvent;
  const last = makeOntimeEvent({
    id: 'last',
    dayOffset: 1,
    timeStart: MILLIS_PER_HOUR,
    duration: MILLIS_PER_HOUR,
  }) as PlayableEvent;
  const skipped = makeOntimeEvent({ id: 'skipped', dayOffset: 2, timeStart: 0, duration: MILLIS_PER_HOUR, skip: true });
  const rundown = makeRundown({
    order: [first.id, last.id, skipped.id],
    entries: { [first.id]: first, [last.id]: last, [skipped.id]: skipped },
  });

  expect(getPlannedShowDuration(rundown)).toBe(3 * MILLIS_PER_HOUR);
});
