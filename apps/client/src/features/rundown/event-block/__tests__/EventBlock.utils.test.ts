import { MILLIS_PER_HOUR } from 'ontime-utils';

import { formatDelay, formatOverlap } from '../EventBlock.utils';

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
    const result = formatOverlap(previousStart, previousEnd, timeStart);
    expect(result).toEqual('Overlap 0:30');
  });

  it('bug #949 recognises an overlap between two times', () => {
    const previousStart = 46800000; // 13:00:00
    const previousEnd = 48600000; // 13:30:00
    const timeStart = 48300000; // 13:25:00
    const result = formatOverlap(previousStart, previousEnd, timeStart);
    expect(result).toEqual('Overlap 5:00');
  });

  it('handles events the day after, without overlap', () => {
    const previousStart = 11 * MILLIS_PER_HOUR;
    const previousEnd = 12 * MILLIS_PER_HOUR;
    const timeStart = 6 * MILLIS_PER_HOUR;
    const result = formatOverlap(previousStart, previousEnd, timeStart);
    expect(result).toBe('Gap 18:00:00 (next day)');
  });

  it('handles events the day after, with gap', () => {
    const previousStart = 17 * MILLIS_PER_HOUR;
    const previousEnd = 23 * MILLIS_PER_HOUR;
    const timeStart = 9 * MILLIS_PER_HOUR;
    const result = formatOverlap(previousStart, previousEnd, timeStart);
    expect(result).toBe('Gap 10:00:00 (next day)');
  });

  it('handles events the day after, with previous ending at midnight', () => {
    const previousStart = 23 * MILLIS_PER_HOUR; // 23:00:00
    const previousEnd = 0; // 00:00:00
    const timeStart = 1 * MILLIS_PER_HOUR; // 01:00:00
    const result = formatOverlap(previousStart, previousEnd, timeStart);
    expect(result).toBe('Gap 01:00:00 (next day)');
  });

  it('handles events the day after, with previous ending over midnight', () => {
    const previousStart = 23 * MILLIS_PER_HOUR;
    const previousEnd = 1 * MILLIS_PER_HOUR;
    const timeStart = 2 * MILLIS_PER_HOUR;
    const result = formatOverlap(previousStart, previousEnd, timeStart);
    expect(result).toBe('Gap 01:00:00');
  });
});
