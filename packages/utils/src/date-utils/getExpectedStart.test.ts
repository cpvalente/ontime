import { OffsetMode } from 'ontime-types';

import { dayInMs } from './conversionUtils';
import { getExpectedStart } from './getExpectedStart';

describe('getExpectedStart()', () => {
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
        offset: 0,
        offsetMode: OffsetMode.Absolute,
        actualStart: null,
        plannedStart: null,
      };

      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(testEvent.timeStart);
      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(testEvent.timeStart);
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
        offset: 20,
        offsetMode: OffsetMode.Absolute,
        actualStart: null,
        plannedStart: null,
      };

      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(120);
      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(120);
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
        offset: -10,
        offsetMode: OffsetMode.Absolute,
        actualStart: null,
        plannedStart: null,
      };

      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(100); // <-- when running ahead the unlinked timer stays put
      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(90);
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
        offset: 20,
        offsetMode: OffsetMode.Absolute,
        actualStart: null,
        plannedStart: null,
      };

      expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: false })).toBe(100); // <-- when gap is enough to compensate for the running behind
      // expect(getExpectedStart(testEvent, { ...testState, isLinkedToLoaded: true })).toBe(70); This should not be possible
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
        offset: 20,
        offsetMode: OffsetMode.Absolute,
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
        offsetMode: OffsetMode.Relative,
      };

      const timeStartEvent2 = 10;
      const timeStartEvent3 = 20;

      //event 1 is the currently running event

      //event 2
      expect(
        getExpectedStart(
          { dayOffset: 0, delay: 0, timeStart: timeStartEvent2 },
          { ...testState, isLinkedToLoaded: true },
        ),
      ).toBe(110);
      expect(
        getExpectedStart(
          { dayOffset: 0, delay: 0, timeStart: timeStartEvent2 },
          { ...testState, isLinkedToLoaded: false },
        ),
      ).toBe(110);

      //event 3
      expect(
        getExpectedStart(
          { dayOffset: 0, delay: 0, timeStart: timeStartEvent3 },
          { ...testState, isLinkedToLoaded: true },
        ),
      ).toBe(120);
      expect(
        getExpectedStart(
          { dayOffset: 0, delay: 0, timeStart: timeStartEvent3 },
          { ...testState, isLinkedToLoaded: false },
        ),
      ).toBe(120);

      // if we actually started 5ms later
      testState.actualStart = 105;

      //event 2
      expect(
        getExpectedStart(
          { dayOffset: 0, delay: 0, timeStart: timeStartEvent2 },
          { ...testState, isLinkedToLoaded: true },
        ),
      ).toBe(115);
      expect(
        getExpectedStart(
          { dayOffset: 0, delay: 0, timeStart: timeStartEvent2 },
          { ...testState, isLinkedToLoaded: false },
        ),
      ).toBe(115);

      //event 3
      expect(
        getExpectedStart(
          { dayOffset: 0, delay: 0, timeStart: timeStartEvent3 },
          { ...testState, isLinkedToLoaded: true },
        ),
      ).toBe(125);
      expect(
        getExpectedStart(
          { dayOffset: 0, delay: 0, timeStart: timeStartEvent3 },
          { ...testState, isLinkedToLoaded: false },
        ),
      ).toBe(125);
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
        actualStart: 100,
        plannedStart: 0,
        offset: 0,
        offsetMode: OffsetMode.Relative,
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
        dayOffset: 0,
        delay: 0,
      };
      const testState = {
        currentDay: 0,
        totalGap: 0,
        actualStart: 100,
        plannedStart: 0,
        offset: 0,
        offsetMode: OffsetMode.Relative,
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
        offsetMode: OffsetMode.Relative,
      };

      // this event will start the current day
      expect(
        getExpectedStart(
          { timeStart: 10, delay: 0, dayOffset: 0 },
          { ...testState, totalGap: 0, isLinkedToLoaded: false },
        ),
      ).toBe(110);

      // this event will start the next day
      // in absolute mode this would start in dayInMs - 100 since the gap would compensate
      // but in relative mode with and actual start that is 100 offset it starts in dayInMs
      expect(
        getExpectedStart(
          { timeStart: 0, delay: 0, dayOffset: 1 },
          { ...testState, totalGap: dayInMs - 20, isLinkedToLoaded: false },
        ),
      ).toBe(dayInMs + 100);
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
      actualStart: 100,
      plannedStart: 0,
      offset: 0,
      offsetMode: OffsetMode.Relative,
      isLinkedToLoaded: false,
    };

    // the overlap will be pushed out to the expected available time
    expect(getExpectedStart(testEvent, { ...testState, totalGap: -5 })).toBe(110);
  });
});
