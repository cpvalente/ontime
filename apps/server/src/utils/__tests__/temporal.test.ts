import { getInstant, clockToInstant, instantToClock } from '../temporal.js';
import { timeNow } from '../time.js';

describe('instant utilities', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });
  afterAll(() => {
    vi.useRealTimers();
  });
  const testTimes = [
    '2025-10-05T21:58:18Z',
    '2025-10-05T21:58:18+01:00',
    '2026-10-30T13:08:08+01:00',
    '2026-10-30T13:08:08-01:00',
    '2025-01-03T09:09:09',
    '2024-06-13T11:18:18',
    '2025-03-13T11:18:18',
    'jan 1 22:46:40',
    'jan 1 22:46:41',
    'jan 1 22:46:42',
  ];
  describe('epoch to clock', () => {
    test.each([...testTimes])('handles %s', (time) => {
      vi.setSystemTime(time);
      const instant = getInstant();
      const clock = timeNow();
      expect(clock).not.toBeNaN();
      expect(instantToClock(instant)).toEqual(clock);
    });
  });

  describe('clock to epoch', () => {
    test.each([...testTimes])('handles %s', (time) => {
      vi.setSystemTime(time);
      const instant = getInstant();
      const clock = timeNow();
      expect(clock).not.toBeNaN();
      expect(clockToInstant(clock)).toEqual(instant);
    });
  });
});
