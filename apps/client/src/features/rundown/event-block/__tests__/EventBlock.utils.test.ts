import { MILLIS_PER_HOUR } from 'ontime-utils';

import { formatDelay, formatOverlapOld } from '../EventBlock.utils';

//FIXME: update this test
describe('formatDelay()', () => {
  it('adds a given delay to the start time', () => {
    const timeStart = 60000; // 1 min
    const delay = 60000; // 1 min
    const result = formatDelay(timeStart, delay);
    expect(result).toEqual('New start 00:02');
  });
});

describe('formatOverlap()', () => {
  it('recognises an overlap between two times', () => {
    const previousStart = 0;
    const previousEnd = 60000; // 1 min
    const timeStart = 30000; // 30 sec
    const result = formatOverlapOld(timeStart, previousStart, previousEnd);
    expect(result).toEqual('Overlap 30s');
  });

  it('bug #949 recognises an overlap between two times', () => {
    const previousStart = 46800000; // 13:00:00
    const previousEnd = 48600000; // 13:30:00
    const timeStart = 48300000; // 13:25:00
    const result = formatOverlapOld(timeStart, previousStart, previousEnd);
    expect(result).toEqual('Overlap 5m');
  });

  it('handles events the day after, without overlap', () => {
    const previousStart = 11 * MILLIS_PER_HOUR;
    const previousEnd = 12 * MILLIS_PER_HOUR;
    const timeStart = 6 * MILLIS_PER_HOUR;
    const result = formatOverlapOld(timeStart, previousStart, previousEnd);
    expect(result).toBe('Gap 18h (next day)');
  });

  it('handles events the day after, with gap', () => {
    const previousStart = 17 * MILLIS_PER_HOUR;
    const previousEnd = 23 * MILLIS_PER_HOUR;
    const timeStart = 9 * MILLIS_PER_HOUR;
    const result = formatOverlapOld(timeStart, previousStart, previousEnd);
    expect(result).toBe('Gap 10h (next day)');
  });

  it('handles events the day after, with previous ending at midnight', () => {
    const previousStart = 23 * MILLIS_PER_HOUR; // 23:00:00
    const previousEnd = 0; // 00:00:00
    const timeStart = 1 * MILLIS_PER_HOUR; // 01:00:00
    const result = formatOverlapOld(timeStart, previousStart, previousEnd);
    expect(result).toBe('Gap 1h (next day)');
  });

  it('handles sequential events the day after, with previous ending over midnight', () => {
    const previousStart = 23 * MILLIS_PER_HOUR;
    const previousEnd = 1 * MILLIS_PER_HOUR;
    const timeStart = 1 * MILLIS_PER_HOUR;
    const result = formatOverlapOld(timeStart, previousStart, previousEnd);
    expect(result).toBeUndefined();
  });

  it('handles events the day after, with previous ending over midnight with overlap', () => {
    const previousStart = 23 * MILLIS_PER_HOUR;
    const previousEnd = 2 * MILLIS_PER_HOUR;
    const timeStart = 1 * MILLIS_PER_HOUR;
    const result = formatOverlapOld(timeStart, previousStart, previousEnd);
    expect(result).toBe('Overlap 1h');
  });

  it('handles events the day after, with previous ending over midnight with gap', () => {
    const previousStart = 23 * MILLIS_PER_HOUR;
    const previousEnd = 1 * MILLIS_PER_HOUR;
    const timeStart = 2 * MILLIS_PER_HOUR;
    const result = formatOverlapOld(timeStart, previousStart, previousEnd);
    expect(result).toBe('Gap 1h');
  });
});
