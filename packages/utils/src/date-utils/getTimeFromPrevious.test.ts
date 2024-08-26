import { dayInMs, MILLIS_PER_HOUR } from './conversionUtils';
import { getTimeFromPrevious } from './getTimeFromPrevious';

describe('getTimeFromPrevious', () => {
  it('returns the time elapsed (gap or overlap) from the previous', () => {
    const previousStart = 69600000; // 19:20
    const previousEnd = 71700000; // 19:55
    const previousDuration = 2100000; // 35 minutes
    const currentStart = 75600000; // 21:00
    const currentEnd = 81000000; // 22:30
    const expected = 75600000 - 71700000; // current start - previousEnd

    expect(getTimeFromPrevious(currentStart, currentEnd, previousStart, previousEnd, previousDuration)).toBe(expected);
  });

  it('accounts for partially overlapping events', () => {
    const previousStart = 10;
    const previousEnd = 12;
    const previousDuration = 2;
    const currentStart = 11;
    const currentEnd = 12;
    const expected = -(previousEnd - currentStart);

    expect(getTimeFromPrevious(currentStart, currentEnd, previousStart, previousEnd, previousDuration)).toBe(expected);
  });

  it('accounts for events that are fully contained', () => {
    const previousStart = 8;
    const previousEnd = 16;
    const previousDuration = 8;
    const currentStart = 10;
    const currentEnd = 15;
    const expected = -(previousEnd - currentStart);

    expect(getTimeFromPrevious(currentStart, currentEnd, previousStart, previousEnd, previousDuration)).toBe(expected);
  });

  it('fully overlapping events are the next day', () => {
    const previousStart = 10 * MILLIS_PER_HOUR;
    const previousEnd = 12 * MILLIS_PER_HOUR;
    const previousDuration = previousEnd - previousStart;
    const currentStart = 10 * MILLIS_PER_HOUR;
    const currentEnd = 12 * MILLIS_PER_HOUR;
    const expected = dayInMs - previousDuration;

    expect(getTimeFromPrevious(currentStart, currentEnd, previousStart, previousEnd, previousDuration)).toBe(expected);
  });
});
