import { MILLIS_PER_HOUR } from './conversionUtils';
import { isNewLatest } from './isNewLatest';

//TODO: this test should be updated if could be passed by a function always returning true

describe('isNewLatest', () => {
  it('should be true if there is no previous', () => {
    expect(isNewLatest({ timeStart: 0, duration: MILLIS_PER_HOUR, dayOffset: 0 })).toBe(true);
  });

  it('should be true if it starts when the previous finishes', () => {
    expect(
      isNewLatest(
        { timeStart: 10 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR, dayOffset: 0 },
        { timeStart: 9 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR, dayOffset: 0 },
      ),
    ).toBe(true);
  });

  it('should be true if it starts the same day the previous finishes', () => {
    expect(
      isNewLatest(
        { timeStart: 22 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR, dayOffset: 0 },
        { timeStart: 9 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR, dayOffset: 0 },
      ),
    ).toBe(true);
  });

  it('should be true if it finishes after the previous, accounting for passing midnight', () => {
    expect(
      isNewLatest(
        { timeStart: 1 * MILLIS_PER_HOUR, duration: 2 * MILLIS_PER_HOUR, dayOffset: 1 },
        { timeStart: 23 * MILLIS_PER_HOUR, duration: 2 * MILLIS_PER_HOUR, dayOffset: 0 },
      ),
    ).toBe(true);
  });

  it('should be true if it the next day', () => {
    expect(
      isNewLatest(
        { timeStart: 8 * MILLIS_PER_HOUR, duration: 2 * MILLIS_PER_HOUR, dayOffset: 1 },
        { timeStart: 9 * MILLIS_PER_HOUR, duration: 2 * MILLIS_PER_HOUR, dayOffset: 0 },
      ),
    ).toBe(true);
  });

  it('should be true if it the next day (2)', () => {
    expect(
      isNewLatest(
        { timeStart: 9 * MILLIS_PER_HOUR, duration: 2 * MILLIS_PER_HOUR, dayOffset: 1 },
        { timeStart: 9 * MILLIS_PER_HOUR, duration: 11 * MILLIS_PER_HOUR, dayOffset: 0 },
      ),
    ).toBe(true);
  });
});
