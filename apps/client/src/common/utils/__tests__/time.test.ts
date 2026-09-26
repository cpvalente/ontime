import type { PlanTimezone } from 'ontime-types';
import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import { formatDuration, formatTime, formatTimezoneDelta, getDayShift, getTimezoneDelta, nowInMillis } from '../time';

describe('nowInMillis()', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the current time in milliseconds', () => {
    const mockDate = new Date(2022, 1, 1, 13, 0, 0); // This date corresponds to 13:00:00
    const expectedMillis = 13 * 60 * 60 * 1000;
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const result = nowInMillis();

    expect(result).toBe(expectedMillis);
  });
});

describe('formatTime()', () => {
  it('parses 24h strings', () => {
    const ms = 13 * 60 * 60 * 1000;
    const time = formatTime(ms, { format12: 'hh:mm:ss', format24: 'HH:mm:ss' }, (_format12, format24) => format24);
    expect(time).toStrictEqual('13:00:00');
  });

  it('parses same string in 12h strings', () => {
    const ms = 13 * 60 * 60 * 1000;
    const time = formatTime(ms, { format12: 'hh:mm:ss a', format24: 'HH:mm:ss' }, (format12, _format24) => format12);
    expect(time).toStrictEqual('01:00:00 PM');
  });

  it('handles null times', () => {
    const ms = null;
    const time = formatTime(ms);
    expect(time).toStrictEqual('...');
  });

  it('handles negative times', () => {
    const ms = 1 * 60 * 60 * 1000;
    const time = formatTime(-ms, { format12: 'hh:mm a', format24: 'HH:mm' }, (_format12, format24) => format24);
    expect(time).toStrictEqual('-01:00');
  });

  it('shifts wall-clock times across midnight by the timezone delta', () => {
    const format24 = (_format12: string, format24: string) => format24;
    const options = { format12: 'hh:mm a', format24: 'HH:mm' };

    expect(formatTime(23.5 * MILLIS_PER_HOUR, { ...options, timezoneDelta: 3 * MILLIS_PER_HOUR }, format24)).toBe(
      '02:30',
    );
    expect(formatTime(0.5 * MILLIS_PER_HOUR, { ...options, timezoneDelta: -2 * MILLIS_PER_HOUR }, format24)).toBe(
      '22:30',
    );
    expect(formatTime(0.5 * MILLIS_PER_HOUR, { ...options, timezoneDelta: 0 }, format24)).toBe('00:30');
  });
});

describe('getTimezoneDelta()', () => {
  const lisbonSummer: PlanTimezone = {
    zone: 'Europe/Lisbon',
    utcOffsetMinutes: 60,
    referenceDate: '2026-07-15T12:00:00.000Z',
  };

  it('resolves plan time to no shift', () => {
    expect(getTimezoneDelta('plan', lisbonSummer)).toBe(0);
  });

  it('resolves the delta from the plan timezone to an IANA timezone', () => {
    expect(getTimezoneDelta('America/New_York', lisbonSummer)).toBe(-5 * MILLIS_PER_HOUR);
    expect(getTimezoneDelta('Asia/Kolkata', lisbonSummer)).toBe(4.5 * MILLIS_PER_HOUR);
    expect(getTimezoneDelta('Europe/London', lisbonSummer)).toBe(0);
  });

  it('uses the reference date to resolve DST', () => {
    const lisbonWinter = { ...lisbonSummer, utcOffsetMinutes: 0, referenceDate: '2026-01-15T12:00:00.000Z' };
    expect(getTimezoneDelta('America/New_York', lisbonWinter)).toBe(-5 * MILLIS_PER_HOUR);
    expect(getTimezoneDelta('Europe/Berlin', lisbonWinter)).toBe(MILLIS_PER_HOUR);
  });

  it('resolves unknown timezones to no shift', () => {
    expect(getTimezoneDelta('Not/AZone', lisbonSummer)).toBe(0);
  });
});

describe('getDayShift()', () => {
  it('flags shifts across midnight', () => {
    expect(getDayShift(23.5 * MILLIS_PER_HOUR, 3 * MILLIS_PER_HOUR)).toBe(1);
    expect(getDayShift(0.5 * MILLIS_PER_HOUR, -2 * MILLIS_PER_HOUR)).toBe(-1);
    expect(getDayShift(12 * MILLIS_PER_HOUR, 3 * MILLIS_PER_HOUR)).toBe(0);
    expect(getDayShift(23.5 * MILLIS_PER_HOUR, 0)).toBe(0);
  });

  it('compares against the plan day for times past midnight', () => {
    expect(getDayShift(25 * MILLIS_PER_HOUR, -2 * MILLIS_PER_HOUR)).toBe(-1);
  });
});

describe('formatTimezoneDelta()', () => {
  it('formats a signed delta', () => {
    expect(formatTimezoneDelta(3 * MILLIS_PER_HOUR)).toBe('+3h');
    expect(formatTimezoneDelta(-5.5 * MILLIS_PER_HOUR)).toBe('−5h30m');
  });
});

describe('formatDuration()', () => {
  it('formats durations correctly', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(-5000)).toBe('0m');
    expect(formatDuration(MILLIS_PER_MINUTE)).toBe('1m');
    expect(formatDuration(6 * MILLIS_PER_MINUTE + 11 * MILLIS_PER_SECOND)).toBe('6m');
    expect(formatDuration(MILLIS_PER_MINUTE * 10)).toBe('10m');
    expect(formatDuration(MILLIS_PER_MINUTE * 10 + 100)).toBe('10m');
    expect(formatDuration(MILLIS_PER_MINUTE * 10 - 100)).toBe('9m');
    expect(formatDuration(2 * MILLIS_PER_HOUR + 6 * MILLIS_PER_MINUTE)).toBe('2h6m');
    expect(formatDuration(2 * MILLIS_PER_HOUR + 6 * MILLIS_PER_MINUTE + 45 * MILLIS_PER_SECOND, false)).toBe('2h6m45s');
    expect(formatDuration(599702, false)).toBe('9m59s');
  });
  it('formats durations differently with and without seconds', () => {
    expect(formatDuration(0, false)).toBe('0m');
    expect(formatDuration(0, true)).toBe('0m');
    expect(formatDuration(30 * MILLIS_PER_SECOND, false)).toBe('30s');
    expect(formatDuration(30 * MILLIS_PER_SECOND, true)).toBe('');
    expect(formatDuration(2 * MILLIS_PER_HOUR + 30 * MILLIS_PER_SECOND, false)).toBe('2h30s');
    expect(formatDuration(2 * MILLIS_PER_HOUR + 30 * MILLIS_PER_SECOND, true)).toBe('2h');
    expect(formatDuration(2 * MILLIS_PER_HOUR + 10 * MILLIS_PER_MINUTE + 30 * MILLIS_PER_SECOND, false)).toBe(
      '2h10m30s',
    );
    expect(formatDuration(2 * MILLIS_PER_HOUR + 10 * MILLIS_PER_MINUTE + 30 * MILLIS_PER_SECOND, true)).toBe('2h10m');
  });
});
