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
    const timeEnd = 90000; // 1:30 min
    const result = formatOverlap(previousStart, previousEnd, timeStart, timeEnd);
    expect(result).toEqual('Overlap 0:30');
  });

  it('handles events the day after, without overlap', () => {
    const previousStart = new Date(0).setUTCHours(11).valueOf();
    const previousEnd = new Date(0).setUTCHours(12).valueOf();
    const timeStart = new Date(0).setUTCHours(6).valueOf();
    const timeEnd = new Date(0).setUTCHours(10).valueOf();
    const result = formatOverlap(previousStart, previousEnd, timeStart, timeEnd);
    expect(result).toBeUndefined();
  });

  it('handles events the day after, with overlap', () => {
    const previousStart = new Date(0).setUTCHours(9).valueOf();
    const previousEnd = new Date(0).setUTCHours(10).valueOf();
    const timeStart = new Date(0).setUTCHours(6).valueOf();
    const timeEnd = new Date(0).setUTCHours(11).valueOf();
    const result = formatOverlap(previousStart, previousEnd, timeStart, timeEnd);
    expect(result).toBe('Overlap 02:00:00');
  });
});
