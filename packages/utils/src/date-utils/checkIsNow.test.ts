import { checkIsNow } from './checkIsNow';
import { MILLIS_PER_HOUR } from './conversionUtils';

describe('checkIsNow()', () => {
  test('should return true if now is between timeStart and timeEnd', () => {
    const timeStart = 9;
    const timeEnd = 16;
    const now = 10;
    expect(checkIsNow(timeStart, timeEnd, now)).toBe(true);
  });

  test('should return false if now is before start', () => {
    const timeStart = 9;
    const timeEnd = 16;
    const now = 8;
    expect(checkIsNow(timeStart, timeEnd, now)).toBe(false);
  });

  test('should return false if now is after end', () => {
    const timeStart = 9;
    const timeEnd = 16;
    const now = 20;
    expect(checkIsNow(timeStart, timeEnd, now)).toBe(false);
  });

  test('should return true accounting for events that roll over midnight', () => {
    expect(checkIsNow(22 * MILLIS_PER_HOUR, 8 * MILLIS_PER_HOUR, 23 * MILLIS_PER_HOUR)).toBe(true);
  });
});
