import { TimerType } from 'ontime-types';
import { describe, expect, it, vi } from 'vitest';

import { timerPlaceholder, timerPlaceholderMin } from '../../../common/utils/styleUtils';
import { getFormattedTimer, getTimerByType, isStringBoolean, makeColourString } from '../viewUtils';

vi.mock('../../../common/utils/time', () => ({
  formatTime: vi.fn((ms: number) => `formatted:${ms}`),
}));

describe('getFormattedTimer()', () => {
  const opts = { removeSeconds: false, removeLeadingZero: false };
  const optsMin = { removeSeconds: true, removeLeadingZero: false };

  describe('null or TimerType.None', () => {
    it('returns full placeholder when timer is null and removeSeconds is false', () => {
      expect(getFormattedTimer(null, TimerType.CountDown, 'min', opts)).toBe(timerPlaceholder);
    });

    it('returns minute placeholder when timer is null and removeSeconds is true', () => {
      expect(getFormattedTimer(null, TimerType.CountDown, 'min', optsMin)).toBe(timerPlaceholderMin);
    });

    it('returns full placeholder for TimerType.None regardless of timer value', () => {
      expect(getFormattedTimer(1000, TimerType.None, 'min', opts)).toBe(timerPlaceholder);
    });

    it('returns minute placeholder for TimerType.None when removeSeconds is true', () => {
      expect(getFormattedTimer(1000, TimerType.None, 'min', optsMin)).toBe(timerPlaceholderMin);
    });
  });

  describe('TimerType.Clock', () => {
    it('delegates to formatTime and returns its result', () => {
      const clockMs = 13 * 60 * 60 * 1000;
      const result = getFormattedTimer(clockMs, TimerType.Clock, 'min', opts);
      expect(result).toBe(`formatted:${clockMs}`);
    });

    it('ignores removeSeconds and removeLeadingZero for clock type', () => {
      // removeSeconds and removeLeadingZero only apply to non-clock timer types
      const clockMs = 3600000;
      const resultNormal = getFormattedTimer(clockMs, TimerType.Clock, 'min', opts);
      const resultMinutes = getFormattedTimer(clockMs, TimerType.Clock, 'min', optsMin);
      // Both should delegate to formatTime, so result is the same
      expect(resultNormal).toBe(`formatted:${clockMs}`);
      expect(resultMinutes).toBe(`formatted:${clockMs}`);
    });
  });

  describe('TimerType.CountDown', () => {
    it('formats a positive countdown', () => {
      // 1 hour expressed in milliseconds
      const oneHour = 3600000;
      const result = getFormattedTimer(oneHour, TimerType.CountDown, 'min', opts);
      expect(result).toBe('01:00:00');
    });

    it('formats a negative countdown with seconds', () => {
      const result = getFormattedTimer(-5000, TimerType.CountDown, 'min', opts);
      expect(result).toContain('-');
    });

    it('removes leading zero when removeLeadingZero is true', () => {
      const oneHour = 3600000;
      const withZero = getFormattedTimer(oneHour, TimerType.CountDown, 'min', opts);
      const withoutZero = getFormattedTimer(oneHour, TimerType.CountDown, 'min', {
        removeSeconds: false,
        removeLeadingZero: true,
      });
      // The leading zero version should have one more character
      expect(withZero.length).toBeGreaterThan(withoutZero.length);
    });

    it('removes seconds when removeSeconds is true', () => {
      const oneHour = 3600000;
      const withSeconds = getFormattedTimer(oneHour, TimerType.CountDown, 'min', opts);
      const withoutSeconds = getFormattedTimer(oneHour, TimerType.CountDown, 'min', optsMin);
      // The seconds version should have more characters
      expect(withSeconds.length).toBeGreaterThan(withoutSeconds.length);
    });
  });

  describe('TimerType.CountUp', () => {
    it('formats a count-up timer', () => {
      const fiveMinutes = 5 * 60 * 1000;
      const result = getFormattedTimer(fiveMinutes, TimerType.CountUp, 'min', opts);
      expect(result).toBe('00:05:00');
    });
  });
});

describe('getTimerByType()', () => {
  const timerObject = { current: 5000, elapsed: 3000 };

  it('returns current for CountDown', () => {
    expect(getTimerByType(false, TimerType.CountDown, 100, timerObject)).toBe(5000);
  });

  it('clamps CountDown to 0 when freezeEnd is true and current is negative', () => {
    expect(getTimerByType(true, TimerType.CountDown, 100, { current: -100, elapsed: 0 })).toBe(0);
  });

  it('returns elapsed for CountUp', () => {
    expect(getTimerByType(false, TimerType.CountUp, 100, timerObject)).toBe(3000);
  });

  it('returns clock value for Clock type', () => {
    expect(getTimerByType(false, TimerType.Clock, 99999, timerObject)).toBe(99999);
  });

  it('returns null for None type', () => {
    expect(getTimerByType(false, TimerType.None, 100, timerObject)).toBeNull();
  });

  it('uses timerTypeOverride when provided', () => {
    // Even though timerTypeNow is CountDown, override to Clock
    expect(getTimerByType(false, TimerType.CountDown, 12345, timerObject, TimerType.Clock)).toBe(12345);
  });

  it('returns null for CountDown when current is null', () => {
    expect(getTimerByType(false, TimerType.CountDown, 100, { current: null, elapsed: 3000 })).toBeNull();
  });
});

describe('isStringBoolean()', () => {
  it('returns true for "true"', () => {
    expect(isStringBoolean('true')).toBe(true);
  });

  it('returns true for "TRUE" (case-insensitive)', () => {
    expect(isStringBoolean('TRUE')).toBe(true);
  });

  it('returns true for "1"', () => {
    expect(isStringBoolean('1')).toBe(true);
  });

  it('returns false for null', () => {
    expect(isStringBoolean(null)).toBe(false);
  });

  it('returns false for "false"', () => {
    expect(isStringBoolean('false')).toBe(false);
  });

  it('returns false for "0"', () => {
    expect(isStringBoolean('0')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isStringBoolean('')).toBe(false);
  });
});

describe('makeColourString()', () => {
  it('prepends # when missing', () => {
    expect(makeColourString('ff0000')).toBe('#ff0000');
  });

  it('does not double-prepend # when already present', () => {
    expect(makeColourString('#ff0000')).toBe('#ff0000');
  });

  it('returns undefined for null input', () => {
    expect(makeColourString(null)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(makeColourString('')).toBeUndefined();
  });
});
