import { millisToString } from 'ontime-utils';
import { getEpoch, clockToEpoch, epochToClock } from '../temporal.js';

/**
 * The old clock function
 * is here until is is no longer needed for reference
 */
function timeNow() {
  const now = new Date();

  // extract milliseconds since midnight
  let elapsed = now.getHours() * 3600000;
  elapsed += now.getMinutes() * 60000;
  elapsed += now.getSeconds() * 1000;
  elapsed += now.getMilliseconds();
  return elapsed;
}

describe('epoch utilities', () => {
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
    'jan 1 00:00:42',
  ];
  describe('epoch to clock', () => {
    test.each([...testTimes])('handles %s', (time) => {
      vi.setSystemTime(time);
      const instant = getEpoch();
      const clock = timeNow();
      expect(clock).not.toBeNaN();
      expect(epochToClock(instant)).toEqual(clock);
    });
  });

  describe('clock to epoch', () => {
    test.each([...testTimes])('handles %s', (time) => {
      vi.setSystemTime(time);
      const instant = getEpoch();
      const clock = timeNow();
      expect(clock).not.toBeNaN();
      expect(clockToEpoch(clock)).toEqual(instant);
    });
  });

  test('before DST', () => {
    vi.setSystemTime('2025-03-30T00:58:18Z'); // right before DST
    const instant = getEpoch();
    const clock = timeNow();
    expect(millisToString(clock)).toEqual('01:58:18');
    const convertedInstant = clockToEpoch(clock);
    expect(convertedInstant).toEqual(instant);
    const backToClock = epochToClock(convertedInstant);
    expect(backToClock).toEqual(clock);
  });

  test('after DST', () => {
    vi.setSystemTime('2025-03-30T01:00:00Z'); // right before DST
    const instant = getEpoch();
    const clock = timeNow();
    expect(millisToString(clock)).toEqual('03:00:00');
    const convertedInstant = clockToEpoch(clock);
    expect(convertedInstant).toEqual(instant);
    const backToClock = epochToClock(convertedInstant);
    expect(backToClock).toEqual(clock);
  });

  test('before winter time', () => {
    vi.setSystemTime('2025-10-26T01:59:59Z'); // right before DST
    const instant = getEpoch();
    const clock = timeNow();
    expect(millisToString(clock)).toEqual('02:59:59');
    const convertedInstant = clockToEpoch(clock);
    expect(convertedInstant).toEqual(instant);
    const backToClock = epochToClock(convertedInstant);
    expect(backToClock).toEqual(clock);
  });

  test('after winter time', () => {
    vi.setSystemTime('2025-10-26T02:00:00Z'); // right before DST
    const instant = getEpoch();
    const clock = timeNow();
    expect(millisToString(clock)).toEqual('03:00:00');
    const convertedInstant = clockToEpoch(clock);
    expect(convertedInstant).toEqual(instant);
    const backToClock = epochToClock(convertedInstant);
    expect(backToClock).toEqual(clock);
  });
});
