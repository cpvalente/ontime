import { checkIsNextDay } from './checkIsNextDay';
import { MILLIS_PER_HOUR } from './conversionUtils';

describe('checkIsNextDay', () => {
  it('returns false if the previous event duration is 0', () => {
    const previousStart = 0;
    const previousDuration = 0;
    const timeStart = 0;
    expect(checkIsNextDay(previousStart, timeStart, previousDuration)).toBeFalsy();
  });

  it('returns false if event starts after one before', () => {
    const previousStart = 10;
    const previousDuration = 2;
    const timeStart = 11;
    expect(checkIsNextDay(previousStart, timeStart, previousDuration)).toBeFalsy();
  });

  it('returns true if event starts after one before', () => {
    const previousStart = 10;
    const previousDuration = 2;
    const timeStart = 9;
    expect(checkIsNextDay(previousStart, timeStart, previousDuration)).toBeTruthy();
  });

  it('returns true if event starts at the same time as one before', () => {
    const previousStart = 10;
    const previousDuration = 2;
    const timeStart = 10;
    expect(checkIsNextDay(previousStart, timeStart, previousDuration)).toBeTruthy();
  });

  it('should account for an event that crossed midnight', () => {
    const previousStart = 20 * MILLIS_PER_HOUR;
    const previousDuration = 6 * MILLIS_PER_HOUR; // event finished at 02:00:00
    const timeStart = 1 * MILLIS_PER_HOUR;
    expect(checkIsNextDay(previousStart, timeStart, previousDuration)).toBeFalsy();
  });

  it('should account for an event that crossed midnight and there is a gap', () => {
    const previousStart = 23 * MILLIS_PER_HOUR;
    const timeStart = 2 * MILLIS_PER_HOUR;
    const previousDuration = 2 * MILLIS_PER_HOUR;
    expect(checkIsNextDay(previousStart, timeStart, previousDuration)).toBeFalsy();
  });

  it('should account for an event that crossed midnight with no overlaps', () => {
    const previousStart = 20 * MILLIS_PER_HOUR;
    const previousDuration = 6 * MILLIS_PER_HOUR; // event finished at 02:00:00
    const timeStart = 19 * MILLIS_PER_HOUR;
    expect(checkIsNextDay(previousStart, timeStart, previousDuration)).toBeFalsy();
  });

  it('should account for an event that finishes exactly at midnight', () => {
    const previousStart = 23 * MILLIS_PER_HOUR;
    const previousDuration = 1 * MILLIS_PER_HOUR;
    const timeStart = 2 * MILLIS_PER_HOUR;
    expect(checkIsNextDay(previousStart, timeStart, previousDuration)).toBeTruthy();
  });
});
