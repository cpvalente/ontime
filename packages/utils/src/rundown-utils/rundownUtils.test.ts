import { dayInMs } from '../timeConstants.js';
import { calculateDuration } from './rundownUtils.js';

describe('calculateDuration()', () => {
  describe('Given start and end values', () => {
    it('is the difference between end and start', () => {
      const duration = calculateDuration(10, 20);
      expect(duration).toBe(10);
    });
  });

  describe('Handles edge cases', () => {
    it('handles events that go over midnight', () => {
      const duration = calculateDuration(51, 50);
      expect(duration).not.toBe(-50);
      expect(duration).toBe(dayInMs - 1);
    });
    it('when both are equal', () => {
      const testStart = 1;
      const testEnd = 1;
      const val = calculateDuration(testStart, testEnd);
      expect(val).toBe(testEnd - testStart);
    });

    it('handles no difference', () => {
      const duration1 = calculateDuration(0, 0);
      const duration2 = calculateDuration(dayInMs, dayInMs);
      expect(duration1).toBe(0);
      expect(duration2).toBe(0);
    });
  });
});
