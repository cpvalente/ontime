import { MILLIS_PER_SECOND } from 'ontime-utils';

import { formatDelay, formatGap } from '../EventBlock.utils';

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
    const result = formatGap(-30 * MILLIS_PER_SECOND, false);
    expect(result).toEqual('Overlap 30s');
  });
  it('recognises an gap between two times', () => {
    const result = formatGap(30 * MILLIS_PER_SECOND, false);
    expect(result).toEqual('Gap 30s');
  });
  it('recognises an gap between two times that is next day', () => {
    const result = formatGap(30 * MILLIS_PER_SECOND, true);
    expect(result).toEqual('Gap 30s (next day)');
  });
});
