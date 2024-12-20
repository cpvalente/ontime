import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

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
  it('format gap', () => {
    const gap = 30 * MILLIS_PER_SECOND;
    const result = formatOverlap(gap, false);
    expect(result).toEqual('Gap 30s');
  });

  it('format gap next day', () => {
    const gap = 18 * MILLIS_PER_HOUR;
    const result = formatOverlap(gap, true);
    expect(result).toBe('Gap 18h (next day)');
  });

  it('bug #949 recognises an overlap between two times', () => {
    const overlap = -5 * MILLIS_PER_MINUTE;
    const result = formatOverlap(overlap, false);
    expect(result).toEqual('Overlap 5m');
  });
});
