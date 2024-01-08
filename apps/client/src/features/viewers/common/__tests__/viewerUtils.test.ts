import { removePrefixZeroes } from '../viewerUtils.js';

describe('removePrependedZero', () => {
  it('should remove "00:" from the start of the string', () => {
    const timer = '00:10:10';
    const result = removePrefixZeroes(timer);
    expect(result).toBe('10:10');
  });

  it('should remove "00:0:" from the start of the string', () => {
    const timer = '00:01:10';
    const result = removePrefixZeroes(timer);
    expect(result).toBe('1:10');
  });

  it('should not modify the string if it does not start with "00:" or "00:0:"', () => {
    const timer = '10:10:10';
    const result = removePrefixZeroes(timer);
    expect(result).toBe(timer);
  });
});
