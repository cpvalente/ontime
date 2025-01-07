import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE } from './conversionUtils';
import { isNewLatest } from './isNewLatest';

//TODO: this test should be updated if could be passed by a function always returning true

describe('isNewLatest', () => {
  it('should be true if there is no previous', () => {
    const current = { timeStart: 0, duration: MILLIS_PER_HOUR, dayOffset: 0 };
    const previous = undefined;
    expect(isNewLatest(current, previous)).toBe(true);
  });

  it('should be false if current is contained in the previous', () => {
    const current = {
      timeStart: 21 * MILLIS_PER_HOUR + 10 * MILLIS_PER_MINUTE,
      duration: 10 * MILLIS_PER_MINUTE,
      dayOffset: 0,
    };
    const previous = { timeStart: 21 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR, dayOffset: 0 };

    expect(isNewLatest(current, previous)).toBe(false);
  });

  it('should be true if it starts when the previous finishes', () => {
    const current = { timeStart: 10 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR, dayOffset: 0 };
    const previous = { timeStart: 9 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR, dayOffset: 0 };
    expect(isNewLatest(current, previous)).toBe(true);
  });

  it('should be true if it starts the same day the previous finishes', () => {
    const current = { timeStart: 22 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR, dayOffset: 0 };
    const previous = { timeStart: 9 * MILLIS_PER_HOUR, duration: MILLIS_PER_HOUR, dayOffset: 0 };
    expect(isNewLatest(current, previous)).toBe(true);
  });

  it('should be true if it finishes after the previous, accounting for passing midnight', () => {
    const current = { timeStart: 1 * MILLIS_PER_HOUR, duration: 2 * MILLIS_PER_HOUR, dayOffset: 1 };
    const previous = { timeStart: 23 * MILLIS_PER_HOUR, duration: 2 * MILLIS_PER_HOUR, dayOffset: 0 };

    expect(isNewLatest(current, previous)).toBe(true);
  });

  it('should be true if it the next day', () => {
    const current = { timeStart: 8 * MILLIS_PER_HOUR, duration: 2 * MILLIS_PER_HOUR, dayOffset: 1 };
    const previous = { timeStart: 9 * MILLIS_PER_HOUR, duration: 2 * MILLIS_PER_HOUR, dayOffset: 0 };
    expect(isNewLatest(current, previous)).toBe(true);
  });

  it('should be true if it the next day (2)', () => {
    const current = { timeStart: 9 * MILLIS_PER_HOUR, duration: 2 * MILLIS_PER_HOUR, dayOffset: 1 };
    const previous = { timeStart: 9 * MILLIS_PER_HOUR, duration: 11 * MILLIS_PER_HOUR, dayOffset: 0 };
    expect(isNewLatest(current, previous)).toBe(true);
  });
});
