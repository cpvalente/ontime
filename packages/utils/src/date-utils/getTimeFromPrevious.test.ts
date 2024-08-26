import { getTimeFromPrevious } from './getTimeFromPrevious';

describe('getTimeFromPrevious', () => {
  it('returns the time elapsed (gap or overlap) from the previous', () => {
    const previousStart = 69600000; // 19:20
    const previousEnd = 71700000; // 19:55
    const previousDuration = 2100000; // 35 minutes
    const currentStart = 75600000; // 21:00
    const currentEnd = 81000000; // 22:30
    const expected = 75600000 - 71700000; // current staart - previousEnd

    expect(getTimeFromPrevious(currentStart, currentEnd, previousStart, previousEnd, previousDuration)).toBe(expected);
  });
});
