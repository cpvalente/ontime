import { formatTime, getTimeToStart, nowInMillis } from '../time';

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

describe('getTimeToStart()', () => {
  it("is the gap between now and the event's start time accounted for delays", () => {
    const now = 150;
    const start = 150;
    const delay = 50;

    const result = getTimeToStart(now, start, delay, 0);
    expect(result).toBe(50);
  });

  it('accounts for offsets when running behind', () => {
    const now = 150;
    const start = 150;
    const delay = 50;
    const offset = -50; // running behind

    const result = getTimeToStart(now, start, delay, offset);
    expect(result).toBe(50 + 50);
  });

  it('accounts for offsets when running ahead', () => {
    const now = 150;
    const start = 150;
    const delay = 50;
    const offset = 10; // running behind

    const result = getTimeToStart(now, start, delay, offset);
    expect(result).toBe(50 - 10);
  });
});
