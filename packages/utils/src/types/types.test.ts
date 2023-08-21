import { isNumeric } from './types.js';

describe('isNumeric()', () => {
  it('identifies numeric values', () => {
    const testCases = [12, 12.3, Infinity, -Infinity, 0, -0];

    for (const tc of testCases) {
      expect(isNumeric(tc)).toBe(true);
    }
  });
  it('identifies string version of numeric values', () => {
    const testCases = ['12', '12.3', 'Infinity', '-Infinity', '0', '-0'];

    for (const tc of testCases) {
      expect(isNumeric(tc)).toBe(true);
    }
  });
});
