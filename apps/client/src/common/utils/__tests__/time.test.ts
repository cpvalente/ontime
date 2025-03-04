import { calculateTimeUntilStart, formatTime, nowInMillis } from '../time';

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

describe('calculateTimeUntilStart()', () => {
  //TODO: redo

  it('accounts for offsets when running behind', () => {
    const now = 150;
    const start = 150;
    const offset = -50; // running behind

    const result = calculateTimeUntilStart(start, 0, false, now, offset);
    expect(result).toBe(50);
  });
  it('accounts for offsets when running ahead', () => {
    const now = 100;
    const start = 150;
    const offset = 50;

    const result = calculateTimeUntilStart(start, 0, false, now, offset);
    expect(result).toBe(50);
  });
  it('offsets when running ahead are ignored when linked', () => {
    const now = 100;
    const start = 150;
    const offset = 50;

    const result = calculateTimeUntilStart(start, 0, true, now, offset);
    expect(result).toBe(0);
  });
  it('consume gaps when running behind', () => {
    const now = 150;
    const start = 160;
    const gap = 50;
    const offset = -40;

    const result = calculateTimeUntilStart(start, gap, false, now, offset);
    expect(result).toBe(10);
  });
  it('when there is no more gap to consume push out the start time', () => {
    const now = 150;
    const start = 160;
    const gap = 50;
    const offset = -60;

    const result = calculateTimeUntilStart(start, gap, false, now, offset);
    expect(result).toBe(20);
  });
});
