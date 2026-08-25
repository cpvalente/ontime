import type { OntimeEventReport } from 'ontime-types';
import { dayInMs, MILLIS_PER_MINUTE } from 'ontime-utils';

import { getEventVariance } from '../report';

it('uses captured days when measuring an event across midnight', () => {
  const report: OntimeEventReport = {
    startedAt: dayInMs - 5 * MILLIS_PER_MINUTE,
    startedAtDay: 0,
    endedAt: 5 * MILLIS_PER_MINUTE,
    endedAtDay: 1,
    scheduledStart: dayInMs - 5 * MILLIS_PER_MINUTE,
    scheduledDay: 0,
    scheduledDuration: 10 * MILLIS_PER_MINUTE,
  };

  expect(getEventVariance(report)).toMatchObject({
    actualDuration: 10 * MILLIS_PER_MINUTE,
    delta: 0,
    status: 'ontime',
  });
  expect(getEventVariance({ ...report, endedAt: null })).toMatchObject({ status: 'not-run' });
});
