import { dayInMs, millisToString } from 'ontime-utils';
import { Duration, Instant } from 'ontime-types';

import { timeNow } from '../../../utils/time.js';
import * as timeCore from '../timeCore.js';

beforeAll(() => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

// TZ is set to Europe/Copenhagen in vitest.global-setup.ts
// Copenhagen is UTC+1 (CET) in winter and UTC+2 (CEST) in summer

describe('toTimeofDay() converts an instant to local milliseconds since midnight', () => {
  const testTimes = [
    { time: '2025-01-15T08:30:00Z', label: 'winter morning' },
    { time: '2025-06-15T14:00:00Z', label: 'summer afternoon' },
    { time: '2025-01-01T00:00:00Z', label: 'midnight UTC on new years' },
    { time: '2025-07-01T23:59:59Z', label: 'just before midnight UTC in summer' },
    { time: '2025-03-15T12:00:00Z', label: 'noon UTC in winter' },
    { time: '2025-09-15T12:00:00Z', label: 'noon UTC in summer' },
  ];

  test.each(testTimes)('produces the correct local time for $label ($time)', ({ time }) => {
    vi.setSystemTime(time);

    const result = timeCore.toTimeOfDay(timeCore.now());
    expect(result).toBe(timeNow());
  });

  it('returns a value in the range [0, dayInMs)', () => {
    vi.setSystemTime('2025-06-15T23:59:59.999Z');

    const result = timeCore.toTimeOfDay(timeCore.now());
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(dayInMs);
  });

  describe('handles DST transitions in Europe/Copenhagen', () => {
    it('produces CET time just before spring forward', () => {
      // 2025-03-30 at 02:00 CET clocks jump to 03:00 CEST
      // UTC 00:58:18 → Copenhagen CET (UTC+1) → local 01:58:18
      vi.setSystemTime('2025-03-30T00:58:18Z');

      const result = timeCore.toTimeOfDay(timeCore.now());
      expect(millisToString(result)).toBe('01:58:18');
    });

    it('produces CEST time just after spring forward', () => {
      // UTC 01:00:00 → Copenhagen CEST (UTC+2) → local 03:00:00
      // 02:00 local does not exist, clocks skip to 03:00
      vi.setSystemTime('2025-03-30T01:00:00Z');

      const result = timeCore.toTimeOfDay(timeCore.now());
      expect(millisToString(result)).toBe('03:00:00');
    });

    it('produces CEST time just before fall back', () => {
      // 2025-10-26 at 03:00 CEST clocks fall back to 02:00 CET
      // UTC 00:59:59 → Copenhagen CEST (UTC+2) → local 02:59:59
      vi.setSystemTime('2025-10-26T00:59:59Z');

      const result = timeCore.toTimeOfDay(timeCore.now());
      expect(millisToString(result)).toBe('02:59:59');
    });

    it('produces CET time just after fall back', () => {
      // UTC 01:00:00 → Copenhagen CET (UTC+1) → local 02:00:00
      vi.setSystemTime('2025-10-26T01:00:00Z');

      const result = timeCore.toTimeOfDay(timeCore.now());
      expect(millisToString(result)).toBe('02:00:00');
    });
  });
});

describe('toInstant() converts a time of day back to an instant anchored to a reference day', () => {
  const testTimes = [
    { time: '2025-01-15T08:30:00Z', label: 'winter morning' },
    { time: '2025-06-15T14:00:00Z', label: 'summer afternoon' },
    { time: '2025-01-01T00:00:00Z', label: 'midnight UTC on new years' },
    { time: '2025-07-01T23:59:59Z', label: 'just before midnight UTC in summer' },
    { time: '2025-03-15T12:00:00Z', label: 'noon UTC in winter' },
    { time: '2025-09-15T12:00:00Z', label: 'noon UTC in summer' },
  ];

  test.each(testTimes)('roundtrips through toTimeofDay for $label ($time)', ({ time }) => {
    vi.setSystemTime(time);

    const instant = timeCore.now();
    const clock = timeCore.toTimeOfDay(instant);
    expect(timeCore.toInstant(clock, instant)).toBe(instant);
  });

  describe('roundtrips through DST transitions in Europe/Copenhagen', () => {
    it('roundtrips just before spring forward', () => {
      vi.setSystemTime('2025-03-30T00:58:18Z');

      const instant = timeCore.now();
      const clock = timeCore.toTimeOfDay(instant);
      expect(timeCore.toInstant(clock, instant)).toBe(instant);
    });

    it('roundtrips just after spring forward', () => {
      vi.setSystemTime('2025-03-30T01:00:00Z');

      const instant = timeCore.now();
      const clock = timeCore.toTimeOfDay(instant);
      expect(timeCore.toInstant(clock, instant)).toBe(instant);
    });

    it('roundtrips just before fall back', () => {
      vi.setSystemTime('2025-10-26T00:59:59Z');

      const instant = timeCore.now();
      const clock = timeCore.toTimeOfDay(instant);
      expect(timeCore.toInstant(clock, instant)).toBe(instant);
    });

    it('roundtrips just after fall back', () => {
      vi.setSystemTime('2025-10-26T01:00:00Z');

      const instant = timeCore.now();
      const clock = timeCore.toTimeOfDay(instant);
      expect(timeCore.toInstant(clock, instant)).toBe(instant);
    });
  });
});

describe('timeSince() returns the duration elapsed since a past point', () => {
  it('measures elapsed time between two instants', () => {
    const start = 1000 as Instant;
    const end = 5000 as Instant;
    expect(timeCore.timeSince(end, start)).toBe(4000);
  });

  it('returns negative when the reference is in the future', () => {
    const start = 5000 as Instant;
    const end = 1000 as Instant;
    expect(timeCore.timeSince(end, start)).toBe(-4000);
  });
});

describe('timeUntil() returns the duration until a future point', () => {
  it('measures time remaining until a future instant', () => {
    const current = 1000 as Instant;
    const target = 5000 as Instant;
    expect(timeCore.timeUntil(current, target)).toBe(4000);
  });

  it('returns negative when the target is in the past', () => {
    const current = 5000 as Instant;
    const target = 1000 as Instant;
    expect(timeCore.timeUntil(current, target)).toBe(-4000);
  });
});

describe('addDuration() moves a point in time by a duration', () => {
  it('moves an instant forward', () => {
    const instant = 1000 as Instant;
    const duration = 500 as Duration;
    expect(timeCore.addDuration(instant, duration)).toBe(1500);
  });

  it('moves backward with a negative duration', () => {
    const instant = 1000 as Instant;
    const duration = -300 as Duration;
    expect(timeCore.addDuration(instant, duration)).toBe(700);
  });

  it('moves by the sum of multiple durations', () => {
    const instant = 1000 as Instant;
    const durations = [500, -300, 50] as Duration[];
    expect(timeCore.addDuration(instant, durations)).toBe(1250);
  });

  it('keeps the instant unchanged with an empty duration list', () => {
    const instant = 1000 as Instant;
    expect(timeCore.addDuration(instant, [])).toBe(1000);
  });
});
