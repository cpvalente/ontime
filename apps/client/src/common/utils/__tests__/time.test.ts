import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import { formatDuration, formatTime, nowInMillis } from '../time';

describe('nowInMillis()', () => {
  it('should return the current time in milliseconds', () => {
    const mockDate = new Date(2022, 1, 1, 13, 0, 0); // This date corresponds to 13:00:00
    const expectedMillis = 13 * 60 * 60 * 1000;
    const dateSpy = vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    const result = nowInMillis();

    expect(result).toBe(expectedMillis);
    dateSpy.mockRestore();
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
});

describe('formatDuration()', () => {
  it('formats durations correctly', () => {
    expect(formatDuration(0)).toBe('0h 0m');
    expect(formatDuration(-5000)).toBe('0h 0m');
    expect(formatDuration(MILLIS_PER_MINUTE)).toBe('1m');
    expect(formatDuration(6 * MILLIS_PER_MINUTE + 11 * MILLIS_PER_SECOND)).toBe('6m');
    expect(formatDuration(MILLIS_PER_MINUTE * 10)).toBe('10m');
    expect(formatDuration(MILLIS_PER_MINUTE * 10 + 100)).toBe('10m');
    expect(formatDuration(MILLIS_PER_MINUTE * 10 - 100)).toBe('9m');
    expect(formatDuration(2 * MILLIS_PER_HOUR + 6 * MILLIS_PER_MINUTE)).toBe('2h6m');
    expect(formatDuration(2 * MILLIS_PER_HOUR + 6 * MILLIS_PER_MINUTE + 45 * MILLIS_PER_SECOND, false)).toBe('2h6m45s');
    expect(formatDuration(599702, false)).toBe('9m59s');
  });
});
