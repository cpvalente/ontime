import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE } from './conversionUtils';
import { getTimeFromPrevious } from './getTimeFromPrevious';

describe('getTimeFromPrevious', () => {
  it('returns the time elapsed (gap or overlap) from the previous', () => {
    const previousStart = 19 * MILLIS_PER_HOUR + 20 * MILLIS_PER_MINUTE; // 19:20
    const previousDuration = 35 * MILLIS_PER_MINUTE; // 35 minutes -> 19:55
    const previousStartDay = 0; //same day
    const currentStartDay = 0; //same day
    const currentStart = 21 * MILLIS_PER_HOUR; // 21:00
    const expected = 1 * MILLIS_PER_HOUR + 5 * MILLIS_PER_MINUTE;

    expect(getTimeFromPrevious(currentStart, currentStartDay, previousStart, previousDuration, previousStartDay)).toBe(
      expected,
    );
  });

  it('accounts for partially overlapping events', () => {
    const previousStart = 19 * MILLIS_PER_HOUR + 20 * MILLIS_PER_MINUTE; // 19:20
    const previousDuration = 35 * MILLIS_PER_MINUTE; // 35 minutes -> 19:55
    const currentStart = 19 * MILLIS_PER_HOUR + 50 * MILLIS_PER_MINUTE; // 19:50
    const previousStartDay = 0; //same day
    const currentStartDay = 0; //same day
    const expected = -5 * MILLIS_PER_MINUTE;

    expect(getTimeFromPrevious(currentStart, currentStartDay, previousStart, previousDuration, previousStartDay)).toBe(
      expected,
    );
  });

  it('accounts for events that are fully contained', () => {
    const previousStart = 8 * MILLIS_PER_HOUR; // 08:00
    const previousDuration = 8 * MILLIS_PER_HOUR; // 8h -> 16:00
    const currentStart = 10 * MILLIS_PER_HOUR; // 10:00
    const previousStartDay = 0; //same day
    const currentStartDay = 0; //same day

    const expected = -6 * MILLIS_PER_HOUR;

    expect(getTimeFromPrevious(currentStart, currentStartDay, previousStart, previousDuration, previousStartDay)).toBe(
      expected,
    );
  });

  it('fully overlapping events are the next day', () => {
    const previousStart = 10 * MILLIS_PER_HOUR; // 10:00
    const previousDuration = 2 * MILLIS_PER_HOUR; // 2h -> 12:00
    const currentStart = 10 * MILLIS_PER_HOUR; // 10:00
    const previousStartDay = 0; //same day
    const currentStartDay = 1; //next day

    //Next Day + 10h
    const expected = 12 * MILLIS_PER_HOUR + 10 * MILLIS_PER_HOUR;

    expect(getTimeFromPrevious(currentStart, currentStartDay, previousStart, previousDuration, previousStartDay)).toBe(
      expected,
    );
  });

  it('accounts for events that are the day after', () => {
    const previousStart = 20 * MILLIS_PER_HOUR; // 20:00
    const previousDuration = 2 * MILLIS_PER_HOUR; // 2h -> 22:00
    const currentStart = 1 * MILLIS_PER_HOUR; // 01:00
    const previousStartDay = 0; //same day
    const currentStartDay = 1; //next day

    const expected = 3 * MILLIS_PER_HOUR;

    expect(getTimeFromPrevious(currentStart, currentStartDay, previousStart, previousDuration, previousStartDay)).toBe(
      expected,
    );
  });

  it('accounts for events that cross midnight', () => {
    const previousStart = 20 * MILLIS_PER_HOUR; // 20:00
    const previousDuration = 6 * MILLIS_PER_HOUR; // 6h -> 02:00
    const currentStart = 1 * MILLIS_PER_HOUR; // 01:00
    const previousStartDay = 0; //same day
    const currentStartDay = 1; //next day

    const expected = -1 * MILLIS_PER_HOUR;

    expect(getTimeFromPrevious(currentStart, currentStartDay, previousStart, previousDuration, previousStartDay)).toBe(
      expected,
    );
  });
});
