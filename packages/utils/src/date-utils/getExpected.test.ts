import { Day, OffsetMode } from 'ontime-types';

import { MILLIS_PER_HOUR, dayInMs } from './conversionUtils';
import { getExpectedEnd, getExpectedStart } from './getExpected';

describe('getExpectedStart()', () => {
  describe('Absolute offset mode', () => {
    test('ontime', () => {
      const testEvent = {
        timeStart: 100,
        delay: 0,
        dayOffset: 0 as Day,
      };
      const testState = {
        currentDay: 0,
        totalGap: 0,
        offset: 0,
        mode: OffsetMode.Absolute,
        actualStart: null,
        plannedStart: null,
      };

      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(testEvent.timeStart);
      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(testEvent.timeStart);
    });

    test('running behind', () => {
      const testEvent = {
        timeStart: 100,
        dayOffset: 0 as Day,
        delay: 0,
      };
      const testState = {
        currentDay: 0,
        totalGap: 0,
        offset: 20,
        mode: OffsetMode.Absolute,
        actualStart: null,
        plannedStart: null,
      };

      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(120);
      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(120);
    });

    test('running ahead', () => {
      const testEvent = {
        timeStart: 100,
        dayOffset: 0 as Day,
        delay: 0,
      };
      const testState = {
        currentDay: 0,
        totalGap: 0,
        offset: -10,
        mode: OffsetMode.Absolute,
        actualStart: null,
        plannedStart: null,
      };

      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(100); // <-- when running ahead the unlinked timer stays put
      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(90);
    });

    test('running behind with enough gaps', () => {
      const testEvent = {
        timeStart: 100,
        dayOffset: 0 as Day,
        delay: 0,
      };
      const testState = {
        currentDay: 0,
        totalGap: 20,
        offset: 20,
        mode: OffsetMode.Absolute,
        actualStart: null,
        plannedStart: null,
      };

      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(100); // <-- when gap is enough to compensate for the running behind
      // expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(70); This should not be possible
    });

    test('running behind with too little gaps', () => {
      const testEvent = {
        timeStart: 100,
        dayOffset: 0 as Day,
        delay: 0,
      };
      const testState = {
        currentDay: 0,
        totalGap: 10,
        offset: 20,
        mode: OffsetMode.Absolute,
        actualStart: 0,
        plannedStart: 0,
      };

      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(110); // <-- when gap is not enough to compensate for the running behind it absorbs at much as possible
      // expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(70); This should not be possible
    });
  });

  describe('Relative offset mode', () => {
    test('basic function', () => {
      const testState = {
        currentDay: 0,
        totalGap: 0,
        actualStart: 100,
        plannedStart: 0,
        offset: 0,
        mode: OffsetMode.Relative,
      };

      const timeStartEvent2 = 10;
      const timeStartEvent3 = 20;

      //event 1 is the currently running event

      //event 2
      expect(
        getExpectedStart(
          { dayOffset: 0 as Day, delay: 0, timeStart: timeStartEvent2 },
          { ...testState, isLinkedToLoaded: true },
        ),
      ).toBe(110);
      expect(
        getExpectedStart(
          { dayOffset: 0 as Day, delay: 0, timeStart: timeStartEvent2 },
          { ...testState, isLinkedToLoaded: false },
        ),
      ).toBe(110);

      //event 3
      expect(
        getExpectedStart(
          { dayOffset: 0 as Day, delay: 0, timeStart: timeStartEvent3 },
          { ...testState, isLinkedToLoaded: true },
        ),
      ).toBe(120);
      expect(
        getExpectedStart(
          { dayOffset: 0 as Day, delay: 0, timeStart: timeStartEvent3 },
          { ...testState, isLinkedToLoaded: false },
        ),
      ).toBe(120);

      // if we actually started 5ms later
      testState.actualStart = 105;

      //event 2
      expect(
        getExpectedStart(
          { dayOffset: 0 as Day, delay: 0, timeStart: timeStartEvent2 },
          { ...testState, isLinkedToLoaded: true },
        ),
      ).toBe(115);
      expect(
        getExpectedStart(
          { dayOffset: 0 as Day, delay: 0, timeStart: timeStartEvent2 },
          { ...testState, isLinkedToLoaded: false },
        ),
      ).toBe(115);

      //event 3
      expect(
        getExpectedStart(
          { dayOffset: 0 as Day, delay: 0, timeStart: timeStartEvent3 },
          { ...testState, isLinkedToLoaded: true },
        ),
      ).toBe(125);
      expect(
        getExpectedStart(
          { dayOffset: 0 as Day, delay: 0, timeStart: timeStartEvent3 },
          { ...testState, isLinkedToLoaded: false },
        ),
      ).toBe(125);
    });

    test('gaps', () => {
      const testEvent = {
        timeStart: 20,
        dayOffset: 0 as Day,
        delay: 0,
      };
      const testState = {
        currentDay: 0,
        totalGap: 10,
        actualStart: 100,
        plannedStart: 0,
        offset: 0,
        mode: OffsetMode.Relative,
      };

      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(120);
      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(120);

      // if we actually started 5ms later
      testState.actualStart = 105;
      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(125);
      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(125);
    });

    test('added/remove time', () => {
      const testEvent = {
        timeStart: 20,
        dayOffset: 0 as Day,
        delay: 0,
      };
      const testState = {
        currentDay: 0,
        totalGap: 0,
        actualStart: 100,
        plannedStart: 0,
        offset: 0,
        mode: OffsetMode.Relative,
      };

      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(120);
      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(120);

      testState.offset = -5; // remove 5 with addtime - we are ahead of time

      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(115);
      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(120); // unlinked events will stay on schedule

      testState.offset = +5; // add 5 with addtime - we are behind

      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(125);
      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(125);
    });

    test('next day', () => {
      const testState = {
        currentDay: 0,
        actualStart: 100,
        plannedStart: 0,
        offset: 0,
        mode: OffsetMode.Relative,
      };

      // this event will start the current day
      expect(
        getExpectedStart(
          { timeStart: 10, delay: 0, dayOffset: 0 as Day },
          { ...testState, totalGap: 0, isLinkedToLoaded: false },
        ),
      ).toBe(110);

      // this event will start the next day
      // in absolute mode this would start in dayInMs - 100 since the gap would compensate
      // but in relative mode with and actual start that is 100 offset it starts in dayInMs
      expect(
        getExpectedStart(
          { timeStart: 0, delay: 0, dayOffset: 1 as Day },
          { ...testState, totalGap: dayInMs - 20, isLinkedToLoaded: false },
        ),
      ).toBe(dayInMs + 100);
    });
  });

  test('overlap with negative total gap', () => {
    const testEvent = {
      timeStart: 5,
      dayOffset: 0 as Day,
      delay: 0,
    };
    const testState = {
      currentDay: 0,
      actualStart: 100,
      plannedStart: 0,
      offset: 0,
      mode: OffsetMode.Relative,
      isLinkedToLoaded: false,
    };

    // the overlap will be pushed out to the expected available time
    expect(getExpectedStart(testEvent, { ...testState, totalGap: -5 })).toBe(110);
  });

  test('we started on the day before', () => {
    const testEvent = {
      timeStart: 5,
      dayOffset: 0 as Day,
      delay: 0,
    };
    const testState = {
      currentDay: -1,
      actualStart: 23 * MILLIS_PER_HOUR,
      plannedStart: 0,
      offset: -1 * MILLIS_PER_HOUR,
      mode: OffsetMode.Absolute,
      isLinkedToLoaded: true,
      totalGap: 0,
    };
    expect(getExpectedStart(testEvent, { ...testState })).toBe(23 * MILLIS_PER_HOUR + 5);
  });

  test('next day in multi-day rundown', () => {
    const testEvent = {
      timeStart: 5,
      dayOffset: 1 as Day,
      delay: 0,
    };
    const testState = {
      currentDay: -1,
      actualStart: 23 * MILLIS_PER_HOUR,
      plannedStart: 0,
      offset: -1 * MILLIS_PER_HOUR,
      mode: OffsetMode.Absolute,
      isLinkedToLoaded: true,
      totalGap: 0,
    };
    expect(getExpectedStart(testEvent, { ...testState })).toBe(23 * MILLIS_PER_HOUR + 5 + dayInMs);
    expect(getExpectedStart(testEvent, { ...testState, currentDay: 0 })).toBe(23 * MILLIS_PER_HOUR + 5);
  });
});

describe('getExpectedEnd()', () => {
  const baseState = {
    currentDay: 0,
    totalGap: 0,
    mode: OffsetMode.Absolute,
    actualStart: null,
    plannedStart: null,
    isLinkedToLoaded: true,
  };

  test('a regular event ends at its expected start plus duration', () => {
    const testEvent = {
      timeStart: 100,
      duration: 50,
      delay: 0,
      dayOffset: 0 as Day,
      countToEnd: false,
    };

    // on schedule
    expect(getExpectedEnd(testEvent, { ...baseState, offset: 0 })).toBe(150);
    // running 20 behind pushes the end out
    expect(getExpectedEnd(testEvent, { ...baseState, offset: 20 })).toBe(170);
  });

  test('a countToEnd event pins to the planned end while in overtime', () => {
    const testEvent = {
      timeStart: 100,
      duration: 50,
      delay: 0,
      dayOffset: 0 as Day,
      countToEnd: true,
    };

    // overtime would otherwise push the end to 170, but countToEnd absorbs it and pins to 150
    expect(getExpectedEnd(testEvent, { ...baseState, offset: 20 })).toBe(150);
  });

  test('a countToEnd event pins to the planned end while ahead of schedule', () => {
    const testEvent = {
      timeStart: 100,
      duration: 50,
      delay: 0,
      dayOffset: 0 as Day,
      countToEnd: true,
    };

    // ahead of schedule the start moves earlier (90) but the end stays pinned to 150
    expect(getExpectedEnd(testEvent, { ...baseState, offset: -10 })).toBe(150);
  });

  test('an overnight countToEnd event returns a normalised end', () => {
    // event starts at 23:00 and counts to 01:00 the next day -> duration spans midnight
    const timeStart = 23 * MILLIS_PER_HOUR;
    const duration = 2 * MILLIS_PER_HOUR;
    const testEvent = {
      timeStart,
      duration,
      delay: 0,
      dayOffset: 0 as Day,
      countToEnd: true,
    };

    expect(getExpectedEnd(testEvent, { ...baseState, offset: 0 })).toBe(timeStart + duration);
  });
});
