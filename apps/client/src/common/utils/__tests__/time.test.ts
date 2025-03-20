import { OffsetMode } from 'ontime-types';
import { dayInMs } from 'ontime-utils';

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
  describe('Absolute', () => {
    test('ontime', () => {
      const test = {
        timeStart: 100,
        dayOffset: 0,
        delay: 0,
        currentDay: 0,
        totalGap: 0,
        clock: 90,
        offset: 0,
        offsetMode: OffsetMode.Absolute,
        actualStart: null,
        plannedStart: null,
      };

      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: false })).toBe(10);
      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: true })).toBe(10);
    });

    test('running behind', () => {
      const test = {
        timeStart: 100,
        dayOffset: 0,
        delay: 0,
        currentDay: 0,
        totalGap: 0,
        clock: 90,
        offset: -20,
        offsetMode: OffsetMode.Absolute,
        actualStart: null,
        plannedStart: null,
      };

      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: false })).toBe(30);
      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: true })).toBe(30);
    });

    test('running ahead', () => {
      const test = {
        timeStart: 100,
        dayOffset: 0,
        delay: 0,
        currentDay: 0,
        totalGap: 0,
        clock: 80,
        offset: 10,
        offsetMode: OffsetMode.Absolute,
        actualStart: null,
        plannedStart: null,
      };

      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: false })).toBe(20); // <-- when running ahead the unlinked timer stays put
      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: true })).toBe(10);
    });

    test('running behind with enough gaps', () => {
      const test = {
        timeStart: 100,
        dayOffset: 0,
        delay: 0,
        currentDay: 0,
        totalGap: 20,
        clock: 50,
        offset: -20,
        offsetMode: OffsetMode.Absolute,
        actualStart: null,
        plannedStart: null,
      };

      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: false })).toBe(50);
      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: true })).toBe(70); // This should not be possible
    });

    test('running behind with to little gaps', () => {
      const test = {
        timeStart: 100,
        dayOffset: 0,
        delay: 0,
        currentDay: 0,
        totalGap: 10,
        clock: 50,
        offset: -20,
        offsetMode: OffsetMode.Absolute,
        actualStart: 0,
        plannedStart: 0,
      };

      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: false })).toBe(60);
      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: true })).toBe(70); // This should not be possible
    });
  });

  describe('Relative', () => {
    test('Basic test', () => {
      const test = {
        timeStart: 0,
        dayOffset: 0,
        delay: 0,
        currentDay: 0,
        totalGap: 0,
        clock: 100,
        actualStart: 100,
        plannedStart: 0,
        offset: 0, // relative
        // offset: -100, // absolute
        offsetMode: OffsetMode.Relative,
      };

      const timeStartEvent2 = 10;
      const timeStartEvent3 = 20;

      expect(calculateTimeUntilStart({ ...test, timeStart: timeStartEvent2, isLinkedToLoaded: true })).toBe(10);
      expect(calculateTimeUntilStart({ ...test, timeStart: timeStartEvent3, isLinkedToLoaded: true })).toBe(20);
      expect(calculateTimeUntilStart({ ...test, timeStart: timeStartEvent2, isLinkedToLoaded: false })).toBe(10);
      expect(calculateTimeUntilStart({ ...test, timeStart: timeStartEvent3, isLinkedToLoaded: false })).toBe(20);

      test.clock = 105;

      expect(calculateTimeUntilStart({ ...test, timeStart: timeStartEvent2, isLinkedToLoaded: true })).toBe(5);
      expect(calculateTimeUntilStart({ ...test, timeStart: timeStartEvent3, isLinkedToLoaded: true })).toBe(15);
      expect(calculateTimeUntilStart({ ...test, timeStart: timeStartEvent2, isLinkedToLoaded: false })).toBe(5);
      expect(calculateTimeUntilStart({ ...test, timeStart: timeStartEvent3, isLinkedToLoaded: false })).toBe(15);
    });

    test('Test gaps', () => {
      const test = {
        timeStart: 20,
        dayOffset: 0,
        delay: 0,
        currentDay: 0,
        totalGap: 10,
        clock: 100,
        actualStart: 100,
        plannedStart: 0,
        offset: 0, // relative
        // offset: -100, // absolute
        offsetMode: OffsetMode.Relative,
      };

      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: true })).toBe(20);
      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: false })).toBe(20);

      test.clock = 105;

      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: true })).toBe(15);
      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: false })).toBe(15);
    });

    test('Test added/remove time', () => {
      const test = {
        timeStart: 20,
        dayOffset: 0,
        delay: 0,
        currentDay: 0,
        totalGap: 0,
        clock: 100,
        actualStart: 100,
        plannedStart: 0,
        offset: 0, // relative
        // offset: -100, // absolute
        offsetMode: OffsetMode.Relative,
      };

      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: true })).toBe(20);
      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: false })).toBe(20);

      test.offset = 5; // remove 5 with addtime - we are ahead of time

      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: true })).toBe(15);
      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: false })).toBe(20); // unlocked evets will stay on schedule

      test.offset = -5; // add 5 with addtime - we are behind

      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: true })).toBe(25);
      expect(calculateTimeUntilStart({ ...test, isLinkedToLoaded: false })).toBe(25);
    });

    test('Test next day', () => {
      const test = {
        // timeStart: 10,
        // dayOffset: 0,
        delay: 0,
        currentDay: 0,
        // totalGap: 0,
        clock: 100,
        actualStart: 100,
        plannedStart: 0,
        offset: 0, // relative
        // offset: -100, // absolute
        offsetMode: OffsetMode.Relative,
      };

      expect(
        calculateTimeUntilStart({
          ...test,
          timeStart: 10,
          dayOffset: 0,
          totalGap: 0,
          isLinkedToLoaded: true,
        }),
      ).toBe(10);
      expect(
        calculateTimeUntilStart({
          ...test,
          timeStart: 10,
          dayOffset: 0,
          totalGap: 0,
          isLinkedToLoaded: false,
        }),
      ).toBe(10);

      expect(
        calculateTimeUntilStart({
          ...test,
          timeStart: 0,
          dayOffset: 1,
          totalGap: dayInMs - 20,
          isLinkedToLoaded: false,
        }),
      ).toBe(dayInMs);

      test.clock = 200;

      expect(
        calculateTimeUntilStart({
          ...test,
          timeStart: 0,
          dayOffset: 1,
          totalGap: dayInMs - 20,
          isLinkedToLoaded: false,
        }),
      ).toBe(dayInMs - 100);
    });
  });

  test('Test overlap', () => {
    const test = {
      // timeStart: 20,
      dayOffset: 0,
      delay: 0,
      currentDay: 0,
      // totalGap: 10,
      clock: 100,
      actualStart: 100,
      plannedStart: 0,
      offset: 0, // relative
      // offset: -100, // absolute
      offsetMode: OffsetMode.Relative,
      isLinkedToLoaded: false,
    };

    expect(calculateTimeUntilStart({ ...test, timeStart: 5, totalGap: -5 })).toBe(10);

    test.clock = 105;
  });
  //TODO: more indepth testing,
  // including day offset handling
  // and more?
});
