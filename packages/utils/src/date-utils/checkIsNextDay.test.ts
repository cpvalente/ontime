import { checkIsNextDay } from './checkIsNextDay';
import { MILLIS_PER_HOUR } from './conversionUtils';

describe('checkIsNextDay', () => {
  it('returns false if there is no previous event', () => {
    const current = { timeStart: 0, dayOffset: 0 };
    const previous = null;
    expect(checkIsNextDay(current, previous)).toBeFalsy();
  });

  it('returns false if event starts after one before', () => {
    const current = { timeStart: 11, dayOffset: 0 };
    const previous = { timeStart: 10, duration: 2, dayOffset: 0 };
    expect(checkIsNextDay(current, previous)).toBeFalsy();
  });

  it('returns true if event starts after one before', () => {
    const current = { timeStart: 9, dayOffset: 1 };
    const previous = { timeStart: 10, duration: 2, dayOffset: 0 };
    expect(checkIsNextDay(current, previous)).toBeTruthy();
  });

  it('returns true if event starts at the same time as one before', () => {
    const current = { timeStart: 10, dayOffset: 1 };
    const previous = { timeStart: 10, duration: 2, dayOffset: 0 };
    expect(checkIsNextDay(current, previous)).toBeTruthy();
  });

  it('should account for an event that crossed midnight', () => {
    const current = { timeStart: 1 * MILLIS_PER_HOUR, dayOffset: 1 };
    const previous = { timeStart: 20 * MILLIS_PER_HOUR, duration: 6 * MILLIS_PER_HOUR, dayOffset: 0 }; // event finished at 02:00:00
    expect(checkIsNextDay(current, previous)).toBeFalsy();
  });

  it('should account for an event that crossed midnight and there is a gap', () => {
    const current = { timeStart: 2 * MILLIS_PER_HOUR, dayOffset: 1 };
    const previous = { timeStart: 23 * MILLIS_PER_HOUR, duration: 2 * MILLIS_PER_HOUR, dayOffset: 0 }; // event finished at 01:00:00
    expect(checkIsNextDay(current, previous)).toBeFalsy();
  });

  it('should account for an event that crossed midnight with no overlaps', () => {
    const current = { timeStart: 19 * MILLIS_PER_HOUR, dayOffset: 1 };
    const previous = { timeStart: 20 * MILLIS_PER_HOUR, duration: 6 * MILLIS_PER_HOUR, dayOffset: 0 }; // event finished at 02:00:00
    expect(checkIsNextDay(current, previous)).toBeFalsy();
  });

  it('should account for an event that finishes exactly at midnight', () => {
    const current = { timeStart: 2 * MILLIS_PER_HOUR, dayOffset: 1 };
    const previous = { timeStart: 23 * MILLIS_PER_HOUR, duration: 1 * MILLIS_PER_HOUR, dayOffset: 0 }; // event finished at 24:00:00
    expect(checkIsNextDay(current, previous)).toBeTruthy();
  });
});
