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
  test('ontime', () => {
    const test = {
      timeStart: 100,
      dayOffset: 0,
      currentDay: 0,
      totalGap: 0,
      clock: 90,
      offset: 0,
    };

    expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: false })).toBe(10);
    expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: true })).toBe(10);
  });

  test('running behind', () => {
    const test = {
      timeStart: 100,
      dayOffset: 0,
      currentDay: 0,
      totalGap: 0,
      clock: 90,
      offset: -20,
    };

    expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: false })).toBe(30);
    expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: true })).toBe(30);
  });

  test('running ahead', () => {
    const test = {
      timeStart: 100,
      dayOffset: 0,
      currentDay: 0,
      totalGap: 0,
      clock: 80,
      offset: 10,
    };

    expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: false })).toBe(20); // <-- when running ahead the unlinked timer stays put
    expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: true })).toBe(10);
  });

  test('running behind with enough gaps', () => {
    const test = {
      timeStart: 100,
      dayOffset: 0,
      currentDay: 0,
      totalGap: 20,
      clock: 50,
      offset: -20,
    };

    expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: false })).toBe(50);
    expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: true })).toBe(70); // This should not be possible
  });

  test('running behind with to little gaps', () => {
    const test = {
      timeStart: 100,
      dayOffset: 0,
      currentDay: 0,
      totalGap: 10,
      clock: 50,
      offset: -20,
    };

    expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: false })).toBe(60);
    expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: true })).toBe(70); // This should not be possible
  });

  //TODO: more indepth testing,
  // including day offset handling
  // and more?
});
