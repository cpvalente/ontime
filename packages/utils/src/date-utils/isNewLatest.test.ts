import { MILLIS_PER_HOUR } from './conversionUtils';
import { isNewLatest } from './isNewLatest';

describe('isNewLatest', () => {
  it('should be true if there is no previous', () => {
    expect(isNewLatest(0, 60000)).toBeTruthy();
  });

  it('should be true if it starts when the previous finishes', () => {
    const nowStart = 10 * MILLIS_PER_HOUR;
    const nowEnd = 11 * MILLIS_PER_HOUR;
    const previousStart = 9 * MILLIS_PER_HOUR;
    const previousEnd = 10 * MILLIS_PER_HOUR;
    expect(isNewLatest(nowStart, nowEnd, previousStart, previousEnd)).toBeTruthy();
  });

  it('should be true if it starts the same day the previous finishes', () => {
    const nowStart = 22 * MILLIS_PER_HOUR;
    const nowEnd = 23 * MILLIS_PER_HOUR;
    const previousStart = 9 * MILLIS_PER_HOUR;
    const previousEnd = 20 * MILLIS_PER_HOUR;
    expect(isNewLatest(nowStart, nowEnd, previousStart, previousEnd)).toBeTruthy();
  });

  it('should be true if it finishes after the previous, accounting for passing midnight', () => {
    const nowStart = 1 * MILLIS_PER_HOUR;
    const nowEnd = 3 * MILLIS_PER_HOUR;
    const previousStart = 23 * MILLIS_PER_HOUR;
    const previousEnd = 2 * MILLIS_PER_HOUR;
    expect(isNewLatest(nowStart, nowEnd, previousStart, previousEnd)).toBeTruthy();
  });

  it('should be true if it the next day', () => {
    const nowStart = 8 * MILLIS_PER_HOUR;
    const nowEnd = 10 * MILLIS_PER_HOUR;
    const previousStart = 9 * MILLIS_PER_HOUR;
    const previousEnd = 11 * MILLIS_PER_HOUR;
    expect(isNewLatest(nowStart, nowEnd, previousStart, previousEnd)).toBeTruthy();
  });

  it('should be true if it the next day (2)', () => {
    const nowStart = 9 * MILLIS_PER_HOUR;
    const nowEnd = 11 * MILLIS_PER_HOUR;
    const previousStart = 9 * MILLIS_PER_HOUR;
    const previousEnd = 11 * MILLIS_PER_HOUR;
    expect(isNewLatest(nowStart, nowEnd, previousStart, previousEnd)).toBeTruthy();
  });
});
