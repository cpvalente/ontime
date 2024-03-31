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
    const previousStart = new Date(0).setUTCHours(11);
    const previousEnd = new Date(0).setUTCHours(12);
    const timeStart = new Date(0).setUTCHours(6);
    const timeEnd = new Date(0).setUTCHours(10);
    const result = formatOverlap(previousStart, previousEnd, timeStart, timeEnd);
    expect(result).toBe('Gap 18:00:00 (next day)');
  });

  it('handles events the day after, with overlap', () => {
    const previousStart = new Date(0).setUTCHours(9);
    const previousEnd = new Date(0).setUTCHours(10);
    const timeStart = new Date(0).setUTCHours(6);
    const timeEnd = new Date(0).setUTCHours(11);
    const result = formatOverlap(previousStart, previousEnd, timeStart, timeEnd);
    expect(result).toBe('Overlap 02:00:00');
  });

  it('handles events the day after, with gap', () => {
    const previousStart = new Date(0).setUTCHours(17);
    const previousEnd = new Date(0).setUTCHours(23);
    const timeStart = new Date(0).setUTCHours(9);
    const timeEnd = new Date(0).setUTCHours(11);
    const result = formatOverlap(previousStart, previousEnd, timeStart, timeEnd);
    expect(result).toBe('Gap 10:00:00 (next day)');
  });
});
