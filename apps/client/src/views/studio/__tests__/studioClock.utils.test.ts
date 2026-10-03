import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';
import { describe, expect, it } from 'vitest';

import { getLargeClockData } from '../studioClock.utils';

describe('getLargeClockData()', () => {
  const clock = 13 * MILLIS_PER_HOUR + 5 * MILLIS_PER_MINUTE + 42 * MILLIS_PER_SECOND;

  it('shows the time with the seconds for the clock ring', () => {
    expect(getLargeClockData(clock, 'HH:mm')).toStrictEqual({ seconds: 42, display: '13:05', meridian: undefined });
  });

  it('separates the meridian in 12 hour formats', () => {
    const { display, meridian } = getLargeClockData(clock, 'hh:mm a');
    expect(display.trim()).toBe('01:05');
    expect(meridian).toBe('PM');
  });
});
