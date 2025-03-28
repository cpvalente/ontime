import { dayInMs, MILLIS_PER_HOUR, MILLIS_PER_MINUTE } from './conversionUtils';
import { getTimeFrom } from './getTimeFrom';

describe('getTimeFrom', () => {
  it('returns the time elapsed (gap or overlap) from the previous', () => {
    const expected = 75600000 - 71700000; // current start - previousEnd
    expect(
      getTimeFrom(
        { timeStart: 21 * MILLIS_PER_HOUR, dayOffset: 0 },
        { timeStart: 19 * MILLIS_PER_HOUR + 20 * MILLIS_PER_MINUTE, duration: 35 * MILLIS_PER_MINUTE, dayOffset: 0 },
      ),
    ).toBe(expected);
  });

  it('accounts for partially overlapping events', () => {
    const expected = -1;
    expect(getTimeFrom({ timeStart: 11, dayOffset: 0 }, { timeStart: 10, duration: 2, dayOffset: 0 })).toBe(expected);
  });

  it('accounts for events that are fully contained', () => {
    const expected = -6;
    expect(getTimeFrom({ timeStart: 10, dayOffset: 0 }, { timeStart: 8, duration: 8, dayOffset: 0 })).toBe(expected);
  });

  it('fully overlapping events are the next day', () => {
    const expected = dayInMs - 2 * MILLIS_PER_HOUR;
    expect(
      getTimeFrom(
        { timeStart: 10 * MILLIS_PER_HOUR, dayOffset: 1 },
        { timeStart: 10 * MILLIS_PER_HOUR, duration: 2 * MILLIS_PER_HOUR, dayOffset: 0 },
      ),
    ).toBe(expected);
  });

  it('accounts for events that are the day after', () => {
    const expected = -MILLIS_PER_HOUR; // (previousEnd - currentStart);
    expect(
      getTimeFrom(
        { timeStart: 22 * MILLIS_PER_HOUR, dayOffset: 0 },
        { timeStart: 20 * MILLIS_PER_HOUR, duration: 3 * MILLIS_PER_HOUR, dayOffset: 0 },
      ),
    ).toBe(expected);
  });

  it('accounts for events that cross midnight', () => {
    const expected = -MILLIS_PER_HOUR; // (previousEnd - currentStart);
    expect(
      getTimeFrom(
        { timeStart: 1 * MILLIS_PER_HOUR, dayOffset: 1 },
        { timeStart: 20 * MILLIS_PER_HOUR, duration: 6 * MILLIS_PER_HOUR, dayOffset: 0 },
      ),
    ).toBe(expected);
  });
});
