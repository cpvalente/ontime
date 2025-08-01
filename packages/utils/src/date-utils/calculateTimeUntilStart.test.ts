import { OffsetMode } from 'ontime-types';

import { calculateTimeUntilStart } from './calculateTimeUntilStart';
import { dayInMs } from './conversionUtils';

describe('calculateTimeUntilStart()', () => {
  describe('Absolute offset mode', () => {
    test('ontime', () => {
      const testEvent = {
        timeStart: 100,
        delay: 0,
        dayOffset: 0,
      };
      const testState = {
        currentDay: 0,
        totalGap: 0,
        clock: 90,
        offset: 0,
        offsetMode: OffsetMode.Absolute,
        actualStart: null,
        plannedStart: null,
      };

      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(10);
      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(10);
    });

    test('running behind', () => {
      const testEvent = {
        timeStart: 100,
        dayOffset: 0,
        delay: 0,
      };
      const testState = {
        currentDay: 0,
        totalGap: 0,
        clock: 90,
        offset: -20,
        offsetMode: OffsetMode.Absolute,
        actualStart: null,
        plannedStart: null,
      };

      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(30);
      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(30);
    });

    test('running ahead', () => {
      const testEvent = {
        timeStart: 100,
        dayOffset: 0,
        delay: 0,
      };
      const testState = {
        currentDay: 0,
        totalGap: 0,
        clock: 80,
        offset: 10,
        offsetMode: OffsetMode.Absolute,
        actualStart: null,
        plannedStart: null,
      };

      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(20); // <-- when running ahead the unlinked timer stays put
      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(10);
    });

    test('running behind with enough gaps', () => {
      const testEvent = {
        timeStart: 100,
        dayOffset: 0,
        delay: 0,
      };
      const testState = {
        currentDay: 0,
        totalGap: 20,
        clock: 50,
        offset: -20,
        offsetMode: OffsetMode.Absolute,
        actualStart: null,
        plannedStart: null,
      };

      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(50); // <-- when gap is enough to compensate for the running behind
      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(70); // This should not be possible
    });

    test('running behind with too little gaps', () => {
      const testEvent = {
        timeStart: 100,
        dayOffset: 0,
        delay: 0,
      };
      const testState = {
        currentDay: 0,
        totalGap: 10,
        clock: 50,
        offset: -20,
        offsetMode: OffsetMode.Absolute,
        actualStart: 0,
        plannedStart: 0,
      };

      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(60); // <-- when gap is not enough to compensate for the running behind it absorbs at much as possible
      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(70); // This should not be possible
    });
  });

  describe('Relative offset mode', () => {
    test('basic function', () => {
      const testState = {
        currentDay: 0,
        totalGap: 0,
        clock: 100,
        actualStart: 100,
        plannedStart: 0,
        offset: 0,
        offsetMode: OffsetMode.Relative,
      };

      const timeStartEvent2 = 10;
      const timeStartEvent3 = 20;

      //event 1 is the currently running event

      //event 2
      expect(
        calculateTimeUntilStart(
          { dayOffset: 0, delay: 0, timeStart: timeStartEvent2 },
          { ...testState, isLinkedToLoaded: true },
        ),
      ).toBe(10);
      expect(
        calculateTimeUntilStart(
          { dayOffset: 0, delay: 0, timeStart: timeStartEvent2 },
          { ...testState, isLinkedToLoaded: false },
        ),
      ).toBe(10);

      //event 3
      expect(
        calculateTimeUntilStart(
          { dayOffset: 0, delay: 0, timeStart: timeStartEvent3 },
          { ...testState, isLinkedToLoaded: true },
        ),
      ).toBe(20);
      expect(
        calculateTimeUntilStart(
          { dayOffset: 0, delay: 0, timeStart: timeStartEvent3 },
          { ...testState, isLinkedToLoaded: false },
        ),
      ).toBe(20);

      // When clock advances by 5ms, time until start should decrease by 5ms
      testState.clock = 105;

      //event 2
      expect(
        calculateTimeUntilStart(
          { dayOffset: 0, delay: 0, timeStart: timeStartEvent2 },
          { ...testState, isLinkedToLoaded: true },
        ),
      ).toBe(5);
      expect(
        calculateTimeUntilStart(
          { dayOffset: 0, delay: 0, timeStart: timeStartEvent2 },
          { ...testState, isLinkedToLoaded: false },
        ),
      ).toBe(5);

      //event 3
      expect(
        calculateTimeUntilStart(
          { dayOffset: 0, delay: 0, timeStart: timeStartEvent3 },
          { ...testState, isLinkedToLoaded: true },
        ),
      ).toBe(15);
      expect(
        calculateTimeUntilStart(
          { dayOffset: 0, delay: 0, timeStart: timeStartEvent3 },
          { ...testState, isLinkedToLoaded: false },
        ),
      ).toBe(15);
    });

    test('gaps', () => {
      const testEvent = {
        timeStart: 20,
        dayOffset: 0,
        delay: 0,
      };
      const testState = {
        currentDay: 0,
        totalGap: 10,
        clock: 100,
        actualStart: 100,
        plannedStart: 0,
        offset: 0,
        offsetMode: OffsetMode.Relative,
      };

      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(20);
      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(20);

      // When clock advances by 5ms, time until start should decrease by 5ms
      testState.clock = 105;
      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(15);
      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(15);
    });

    test('added/remove time', () => {
      const testEvent = {
        timeStart: 20,
        dayOffset: 0,
        delay: 0,
      };
      const testState = {
        currentDay: 0,
        totalGap: 0,
        clock: 100,
        actualStart: 100,
        plannedStart: 0,
        offset: 0,
        offsetMode: OffsetMode.Relative,
      };

      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(20);
      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(20);

      testState.offset = 5; // remove 5 with addtime - we are ahead of time

      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(15);
      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(20); // unlocked evets will stay on schedule

      testState.offset = -5; // add 5 with addtime - we are behind

      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(25);
      expect(calculateTimeUntilStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(25);
    });

    test('next day', () => {
      const testState = {
        currentDay: 0,
        clock: 100,
        actualStart: 100,
        plannedStart: 0,
        offset: 0,
        offsetMode: OffsetMode.Relative,
      };

      // this event will start the current day
      expect(
        calculateTimeUntilStart(
          { timeStart: 10, delay: 0, dayOffset: 0 },
          { ...testState, totalGap: 0, isLinkedToLoaded: false },
        ),
      ).toBe(10);

      // this event will start the next day
      // in absolute mode this would start in dayInMs - 100 since the gap would compensate
      // but in relative mode with and actual start that is 100 offset it starts in dayInMs
      expect(
        calculateTimeUntilStart(
          { timeStart: 0, delay: 0, dayOffset: 1 },
          { ...testState, totalGap: dayInMs - 20, isLinkedToLoaded: false },
        ),
      ).toBe(dayInMs);

      // advancing 100ms
      testState.clock = 200;

      expect(
        calculateTimeUntilStart(
          { timeStart: 0, delay: 0, dayOffset: 1 },
          { ...testState, totalGap: dayInMs - 20, isLinkedToLoaded: false },
        ),
      ).toBe(dayInMs - 100);
    });
  });

  test('overlap with negative total gap', () => {
    const testEvent = {
      timeStart: 5,
      dayOffset: 0,
      delay: 0,
    };
    const testState = {
      currentDay: 0,
      clock: 100,
      actualStart: 100,
      plannedStart: 0,
      offset: 0,
      offsetMode: OffsetMode.Relative,
      isLinkedToLoaded: false,
    };

    // the overlap will be pushed out to the expected available time
    expect(calculateTimeUntilStart(testEvent, { ...testState, totalGap: -5 })).toBe(10);
  });
});
