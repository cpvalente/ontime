import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import { formatDuration, formatTime, nowInMillis, eventDurationMatchGroupTarget } from '../time';

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
});

describe('eventDurationMatchGroupTarget()', () => {
  it('returns unchanged duration when group already matches target', () => {
    const result = eventDurationMatchGroupTarget({
      targetDuration: MILLIS_PER_HOUR,
      groupDuration: MILLIS_PER_HOUR,
      eventDuration: MILLIS_PER_MINUTE * 30,
    });
    expect(result).toStrictEqual(null);
  });

  it('increases event duration when group is shorter than target', () => {
    // Group is 1h short of target, so event duration increases by 1h
    const result = eventDurationMatchGroupTarget({
      targetDuration: MILLIS_PER_HOUR * 2, // 2h
      groupDuration: MILLIS_PER_HOUR, // 1h
      eventDuration: MILLIS_PER_MINUTE * 30, // 30m
    });
    expect(result).toStrictEqual(MILLIS_PER_HOUR + MILLIS_PER_MINUTE * 30); // 1h30m
  });

  it('decreases event duration when group is longer than target', () => {
    // Group is 30m over target, so event duration decreases by 30m
    const result = eventDurationMatchGroupTarget({
      targetDuration: MILLIS_PER_HOUR, // 1h
      groupDuration: MILLIS_PER_HOUR + MILLIS_PER_MINUTE * 30, // 1h30m
      eventDuration: MILLIS_PER_MINUTE * 30, // 30m
    });
    expect(result).toStrictEqual(0);
  });

  it('handles zero target duration', () => {
    const result = eventDurationMatchGroupTarget({
      targetDuration: 0,
      groupDuration: MILLIS_PER_HOUR,
      eventDuration: MILLIS_PER_HOUR,
    });
    expect(result).toStrictEqual(0);
  });

  it('handles zero group duration', () => {
    const result = eventDurationMatchGroupTarget({
      targetDuration: MILLIS_PER_HOUR,
      groupDuration: 0,
      eventDuration: MILLIS_PER_MINUTE * 30,
    });
    expect(result).toStrictEqual(MILLIS_PER_HOUR + MILLIS_PER_MINUTE * 30);
  });

  it('handles zero event duration', () => {
    const result = eventDurationMatchGroupTarget({
      targetDuration: MILLIS_PER_HOUR,
      groupDuration: MILLIS_PER_MINUTE * 30,
      eventDuration: 0,
    });
    expect(result).toStrictEqual(MILLIS_PER_HOUR - MILLIS_PER_MINUTE * 30);
  });

  it('handles all zero values', () => {
    const result = eventDurationMatchGroupTarget({
      targetDuration: 0,
      groupDuration: 0,
      eventDuration: 0,
    });
    expect(result).toStrictEqual(null);
  });

  it('returns null when result would be negative', () => {
    // Group exceeds target by 1.5h, event shrinks by 1.5h (exceeds event duration)
    const result = eventDurationMatchGroupTarget({
      targetDuration: MILLIS_PER_MINUTE * 30,
      groupDuration: MILLIS_PER_HOUR * 2,
      eventDuration: MILLIS_PER_HOUR,
    });
    expect(result).toStrictEqual(null);
  });

  it('handles large durations', () => {
    const result = eventDurationMatchGroupTarget({
      targetDuration: MILLIS_PER_HOUR * 24, // 24h
      groupDuration: MILLIS_PER_HOUR * 12, // 12h
      eventDuration: MILLIS_PER_HOUR, // 1h
    });
    expect(result).toStrictEqual(MILLIS_PER_HOUR * 13); // 13h
  });

  it('returns null when targetDuration is null', () => {
    const result = eventDurationMatchGroupTarget({
      targetDuration: null,
      groupDuration: MILLIS_PER_HOUR,
      eventDuration: MILLIS_PER_MINUTE * 30,
    });
    expect(result).toStrictEqual(null);
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
});
