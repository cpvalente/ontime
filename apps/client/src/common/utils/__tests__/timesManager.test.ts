import { dayInMs } from 'ontime-utils';

import { calculateDuration } from '../timesManager';

describe('calculateDuration()', () => {
  describe('Given start and end values', () => {
    it('calculates duration correctly', () => {
      const testStart = 1;
      const testEnd = 2;
      const val = calculateDuration(testStart, testEnd);
      expect(val).toBe(testEnd - testStart);
    });
  });

  describe('Handles edge cases', () => {
    it('when start is after end', () => {
      const testStart = 3;
      const testEnd = 2;
      const val = calculateDuration(testStart, testEnd);
      expect(val).toBe(testEnd + dayInMs - testStart);
    });
    it('when both are equal', () => {
      const testStart = 1;
      const testEnd = 1;
      const val = calculateDuration(testStart, testEnd);
      expect(val).toBe(testEnd - testStart);
    });
  });
});
