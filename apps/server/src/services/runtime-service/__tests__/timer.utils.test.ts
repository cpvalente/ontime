import { Day, Duration, OffsetMode, Playback, TimeOfDay, TimerPhase } from 'ontime-types';
import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, MILLIS_PER_SECOND, dayInMs, millisToString } from 'ontime-utils';

import { makeOntimeEvent } from '../../../api-data/rundown/__mocks__/rundown.mocks.js';
import type { RuntimeState } from '../../../stores/runtimeState.js';
import {
  type CurrentInput,
  type ElapsedInput,
  type ExpectedFinishInput,
  type ExpectedTimesInput,
  type RuntimeOffsetInput,
  type TimeToBoundaryInput,
  type TimerPhaseInput,
  findDayOffset,
  getCurrent,
  getElapsed,
  getExpectedFinish,
  getExpectedTimes,
  getRuntimeOffset,
  getTimeToBoundary,
  getTimerPhase,
  hasCrossedMidnight,
  normaliseEndTime,
  skippedOutOfEvent,
} from '../timer.utils.js';

const asTimeOfDay = (value: number): RuntimeState['clock'] => value as RuntimeState['clock'];
const tod = (value: number) => value as TimeOfDay;
const dur = (value: number) => value as Duration;

describe('getElapsed()', () => {
  const makeInput = (patch: Partial<ElapsedInput>): ElapsedInput => ({
    clock: tod(0),
    startedAt: null,
    pausedAt: null,
    pausedDuration: dur(0),
    ...patch,
  });

  it('is null if the timer has not started', () => {
    expect(getElapsed(makeInput({ clock: tod(5 * MILLIS_PER_MINUTE) }))).toBeNull();
  });

  it('returns active elapsed time from startedAt', () => {
    const input = makeInput({ clock: tod(5 * MILLIS_PER_MINUTE), startedAt: tod(2 * MILLIS_PER_MINUTE) });
    expect(getElapsed(input)).toBe(3 * MILLIS_PER_MINUTE);
  });

  it('subtracts accumulated pause time', () => {
    const input = makeInput({
      clock: tod(10 * MILLIS_PER_MINUTE),
      startedAt: tod(2 * MILLIS_PER_MINUTE),
      pausedDuration: dur(5 * MILLIS_PER_MINUTE),
    });
    expect(getElapsed(input)).toBe(3 * MILLIS_PER_MINUTE);
  });

  it('uses the current pause start while paused', () => {
    const input = makeInput({
      clock: tod(10 * MILLIS_PER_MINUTE),
      startedAt: tod(2 * MILLIS_PER_MINUTE),
      pausedAt: tod(7 * MILLIS_PER_MINUTE),
      pausedDuration: dur(1 * MILLIS_PER_MINUTE),
    });
    expect(getElapsed(input)).toBe(4 * MILLIS_PER_MINUTE);
  });

  it('counts across midnight', () => {
    const input = makeInput({
      clock: tod(3 * MILLIS_PER_MINUTE), // 00:03
      startedAt: tod(dayInMs - 2 * MILLIS_PER_MINUTE), // 23:58
    });
    expect(getElapsed(input)).toBe(5 * MILLIS_PER_MINUTE);
  });

  it('counts a pause which started after midnight', () => {
    const input = makeInput({
      clock: tod(10 * MILLIS_PER_MINUTE), // 00:10
      startedAt: tod(dayInMs - 2 * MILLIS_PER_MINUTE), // 23:58
      pausedAt: tod(1 * MILLIS_PER_MINUTE), // 00:01
    });
    expect(getElapsed(input)).toBe(3 * MILLIS_PER_MINUTE);
  });
});

describe('getExpectedFinish()', () => {
  const makeInput = (patch: Partial<ExpectedFinishInput>): ExpectedFinishInput => ({
    clock: tod(0),
    event: { countToEnd: false, timeEnd: tod(0) },
    startedAt: null,
    duration: null,
    addedTime: dur(0),
    pausedAt: null,
    ...patch,
  });

  it('is null if there is no event loaded', () => {
    expect(getExpectedFinish(makeInput({ event: null, startedAt: tod(10), duration: dur(10) }))).toBeNull();
  });
  it('is null if we havent started', () => {
    const calculatedFinish = getExpectedFinish(makeInput({ duration: dur(10) }));
    expect(calculatedFinish).toBe(null);
  });
  it('calculates the finish time', () => {
    const calculatedFinish = getExpectedFinish(makeInput({ duration: dur(10), startedAt: tod(1) }));
    expect(calculatedFinish).toBe(11);
  });
  it('adds paused and added times', () => {
    const calculatedFinish = getExpectedFinish(makeInput({ addedTime: dur(20), duration: dur(10), startedAt: tod(1) }));
    expect(calculatedFinish).toBe(31);
  });
  it('added time could be negative', () => {
    const calculatedFinish = getExpectedFinish(
      makeInput({ addedTime: dur(-10), duration: dur(10), startedAt: tod(1) }),
    );
    expect(calculatedFinish).toBe(1);
  });
  it('user could add enough time for it to be negative', () => {
    const calculatedFinish = getExpectedFinish(
      makeInput({ addedTime: dur(-100), duration: dur(10), startedAt: tod(1) }),
    );
    expect(calculatedFinish).toBe(1);
  });
  it('timer can have no duration', () => {
    const calculatedFinish = getExpectedFinish(makeInput({ duration: dur(0), startedAt: tod(1) }));
    expect(calculatedFinish).toBe(1);
  });
  it('finish can be the day after', () => {
    const calculatedFinish = getExpectedFinish(makeInput({ duration: dur(dayInMs), startedAt: tod(10) }));
    expect(calculatedFinish).toBe(10);
  });
  it('pushes the finish by the time spent in the current pause', () => {
    const calculatedFinish = getExpectedFinish(
      makeInput({
        clock: tod(10 * MILLIS_PER_MINUTE),
        startedAt: tod(0),
        duration: dur(20 * MILLIS_PER_MINUTE),
        pausedAt: tod(7 * MILLIS_PER_MINUTE),
      }),
    );
    expect(calculatedFinish).toBe(23 * MILLIS_PER_MINUTE);
  });
  it('counts a pause across midnight', () => {
    const calculatedFinish = getExpectedFinish(
      makeInput({
        clock: tod(1 * MILLIS_PER_MINUTE), // 00:01
        startedAt: tod(23 * MILLIS_PER_HOUR), // 23:00
        duration: dur(2 * MILLIS_PER_HOUR),
        pausedAt: tod(dayInMs - 1 * MILLIS_PER_MINUTE), // 23:59
      }),
    );
    expect(calculatedFinish).toBe(1 * MILLIS_PER_HOUR + 2 * MILLIS_PER_MINUTE);
  });
  describe('on timers of type time-to-end', () => {
    it('finish time is as schedule + added time', () => {
      const calculatedFinish = getExpectedFinish(
        makeInput({
          event: { countToEnd: true, timeEnd: tod(30) },
          addedTime: dur(10),
          duration: dur(dayInMs),
          startedAt: tod(10),
        }),
      );
      expect(calculatedFinish).toBe(40);
    });
    it('handles events that finish the day after', () => {
      const calculatedFinish = getExpectedFinish(
        makeInput({
          event: { countToEnd: true, timeEnd: tod(600000) }, // 00:10:00
          startedAt: tod(79200000), // 22:00:00
        }),
      );
      // expected finish is not a duration but a point in time
      expect(calculatedFinish).toBe(600000);
    });
    it('pushes the finish by the time spent in the current pause', () => {
      const calculatedFinish = getExpectedFinish(
        makeInput({
          event: { countToEnd: true, timeEnd: tod(100) },
          clock: tod(50),
          startedAt: tod(10),
          pausedAt: tod(30),
        }),
      );
      expect(calculatedFinish).toBe(120);
    });
  });
});

describe('getCurrent()', () => {
  const makeInput = (patch: Partial<CurrentInput>): CurrentInput => ({
    clock: tod(0),
    event: { countToEnd: false, timeStart: tod(0), timeEnd: tod(0) },
    startedAt: null,
    duration: dur(0),
    addedTime: dur(0),
    pausedAt: null,
    ...patch,
  });

  it('is duration if it hasnt started', () => {
    const current = getCurrent(makeInput({ addedTime: dur(10), duration: dur(111) }));
    expect(current).toBe(111);
  });
  it('is the remaining time in clock', () => {
    const current = getCurrent(makeInput({ clock: tod(1), duration: dur(10), startedAt: tod(0) }));
    expect(current).toBe(9);
  });
  it('accounts for added times', () => {
    const current = getCurrent(makeInput({ clock: tod(1), addedTime: dur(10), duration: dur(10), startedAt: tod(0) }));
    expect(current).toBe(19);
  });
  it('counts over midnight', () => {
    const current = getCurrent(makeInput({ clock: tod(10), duration: dur(dayInMs + 10), startedAt: tod(10) }));
    expect(current).toBe(dayInMs + 10);
  });
  it('rolls over midnight', () => {
    const current = getCurrent(makeInput({ clock: tod(5), duration: dur(dayInMs + 10), startedAt: tod(10) }));
    expect(current).toBe(15);
  });
  it('midnight holds delays', () => {
    const current = getCurrent(
      makeInput({ clock: tod(5), addedTime: dur(20), duration: dur(dayInMs + 10), startedAt: tod(10) }),
    );
    expect(current).toBe(35);
  });
  it('holds at the pause time while paused', () => {
    const current = getCurrent(
      makeInput({ clock: tod(9), addedTime: dur(3), duration: dur(10), startedAt: tod(0), pausedAt: tod(4) }),
    );
    expect(current).toBe(9);
  });
  it('holds a pause which started after midnight', () => {
    const current = getCurrent(
      makeInput({ clock: tod(50), duration: dur(100), startedAt: tod(dayInMs - 5), pausedAt: tod(5) }),
    );
    expect(current).toBe(90);
  });

  describe('on timers of type count-to-end', () => {
    it('current time is the time to end even if it hasnt started, this is weird, but by design', () => {
      const current = getCurrent(
        makeInput({
          event: { countToEnd: true, timeStart: tod(0), timeEnd: tod(100) },
          clock: tod(30),
          duration: dur(100),
        }),
      );
      expect(current).toBe(70);
    });

    it('current time is the time to end', () => {
      const current = getCurrent(
        makeInput({
          event: { countToEnd: true, timeStart: tod(0), timeEnd: tod(100) },
          clock: tod(30),
          duration: dur(100),
          startedAt: tod(10),
        }),
      );
      expect(current).toBe(70);
    });

    it('current time is the time to end + added time', () => {
      const current = getCurrent(
        makeInput({
          event: { countToEnd: true, timeStart: tod(0), timeEnd: tod(100) },
          clock: tod(30),
          addedTime: dur(7),
          duration: dur(100),
          startedAt: tod(10),
        }),
      );
      expect(current).toBe(77);
    });

    it('keeps counting to the end while paused', () => {
      const current = getCurrent(
        makeInput({
          event: { countToEnd: true, timeStart: tod(0), timeEnd: tod(100) },
          clock: tod(30),
          duration: dur(100),
          startedAt: tod(10),
          pausedAt: tod(20),
        }),
      );
      expect(current).toBe(70);
    });

    it('handles events that finish the day after', () => {
      const current = getCurrent(
        makeInput({
          event: {
            countToEnd: true,
            timeStart: tod(79200000), // 22:00:00
            timeEnd: tod(600000), // 00:10:00
          },
          clock: tod(79500000), // 22:05:00
          startedAt: tod(79200000), // 22:00:00
        }),
      );
      expect(current).toBe(dayInMs - 79500000 + 600000);
    });

    it('handles events that were started late', () => {
      const current = getCurrent(
        makeInput({
          clock: tod(82000000), // 22:46:40 <--- starting 16 min after the scheduled end
          event: {
            countToEnd: true,
            timeStart: tod(77400000), // 21:30:00
            timeEnd: tod(81000000), // 22:30:00
          },
          startedAt: tod(79200000), // 22:00:00
        }),
      );
      expect(current).toBe(81000000 - 82000000); // <-- planned end - now
    });
  });
});

describe('getExpectedFinish() and getCurrentTime() combined', () => {
  const makeInput = (clock: number, addedTime: number): CurrentInput => ({
    clock: tod(clock),
    event: { countToEnd: false, timeStart: tod(0), timeEnd: tod(10) },
    startedAt: tod(0),
    duration: dur(10),
    addedTime: dur(addedTime),
    pausedAt: null,
  });

  it('without added times, they combine to be duration', () => {
    const duration = 10;
    const input = makeInput(0, 0);

    const expectedFinish = getExpectedFinish(input);
    const current = getCurrent(input);

    const elapsed = duration - current;
    expect(expectedFinish).toBe(10);
    expect(elapsed).toBe(0);
    expect(current).toBe(10);
    expect(elapsed + current).toBe(10);
  });
  it('added times influence expected finish', () => {
    const duration = 10;
    const input = makeInput(5, 3);

    const expectedFinish = getExpectedFinish(input);
    const current = getCurrent(input);

    const elapsed = duration - current;
    expect(expectedFinish).toBe(13);
    expect(elapsed).toBe(2);
    expect(current).toBe(8);
  });
});

describe('hasCrossedMidnight()', () => {
  it('returns true when clock wraps from late to early', () => {
    const previous = (23 * MILLIS_PER_HOUR + 59 * MILLIS_PER_MINUTE) as TimeOfDay; // 23:59
    const current = (1 * MILLIS_PER_MINUTE) as TimeOfDay; // 00:01
    expect(hasCrossedMidnight(previous, current)).toBe(true);
  });

  it('returns false when clock moves forward on the same day', () => {
    const previous = (10 * MILLIS_PER_HOUR) as TimeOfDay; // 10:00
    const current = (10 * MILLIS_PER_HOUR + 5 * MILLIS_PER_MINUTE) as TimeOfDay; // 10:05
    expect(hasCrossedMidnight(previous, current)).toBe(false);
  });

  it('returns false when clock value is unchanged', () => {
    const time = (15 * MILLIS_PER_HOUR) as TimeOfDay; // 15:00
    expect(hasCrossedMidnight(time, time)).toBe(false);
  });

  describe('DST transitions', () => {
    it('returns false during DST fall back (~1h backward jump)', () => {
      // During fall back, clock goes from 02:59 → 02:00 (1h backward)
      const previous = (2 * MILLIS_PER_HOUR + 59 * MILLIS_PER_MINUTE) as TimeOfDay; // 02:59
      const current = (2 * MILLIS_PER_HOUR) as TimeOfDay; // 02:00
      expect(hasCrossedMidnight(previous, current)).toBe(false);
    });

    it('returns true at actual midnight (~23h backward jump)', () => {
      // Actual midnight crossing: 23:59 → 00:01 (~23h58m backward)
      const previous = (23 * MILLIS_PER_HOUR + 59 * MILLIS_PER_MINUTE) as TimeOfDay; // 23:59
      const current = (1 * MILLIS_PER_MINUTE) as TimeOfDay; // 00:01
      expect(hasCrossedMidnight(previous, current)).toBe(true);
    });

    it('returns false for small backward jumps near midnight boundary', () => {
      // Edge case: 12h backward is NOT a midnight cross
      const previous = (12 * MILLIS_PER_HOUR) as TimeOfDay; // 12:00
      const current = (0 * MILLIS_PER_HOUR) as TimeOfDay; // 00:00
      expect(hasCrossedMidnight(previous, current)).toBe(false);
    });

    it('returns true for backward jumps exceeding 12h', () => {
      // 12h + 1ms backward IS a midnight cross
      const previous = (12 * MILLIS_PER_HOUR + 1) as TimeOfDay; // 12:00:00.001
      const current = (0 * MILLIS_PER_HOUR) as TimeOfDay; // 00:00
      expect(hasCrossedMidnight(previous, current)).toBe(true);
    });
  });
});

describe('skippedOutOfEvent()', () => {
  const testSkipLimit = 32;
  it('does not consider an event end as a skip', () => {
    const startedAt = 1000;
    const duration = 1000;
    const expectedFinish = startedAt + duration;
    const previousTime = expectedFinish - testSkipLimit / 2;
    const state = {
      clock: previousTime,
      timer: {
        expectedFinish,
        startedAt,
      },
    } as RuntimeState;

    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);

    state.clock = asTimeOfDay(state.clock + testSkipLimit);
    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);
  });

  it('allows rolling backwards in an event', () => {
    const startedAt = 1000;
    const duration = 1000;
    const expectedFinish = startedAt + duration;
    const previousTime = startedAt + testSkipLimit / 2;

    const state = {
      clock: previousTime,
      timer: {
        expectedFinish,
        startedAt,
      },
    } as RuntimeState;

    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);

    state.clock = asTimeOfDay(state.clock + testSkipLimit);
    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);
  });

  it('accounts for crossing midnight', () => {
    const startedAt = dayInMs - testSkipLimit;
    const expectedFinish = 10;
    const previousTime = dayInMs - 1;

    const state = {
      clock: previousTime,
      timer: {
        expectedFinish,
        startedAt,
      },
    } as RuntimeState;

    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);

    state.clock = asTimeOfDay(testSkipLimit - 2);
    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);
  });

  it('allows rolling backwards in an event across midnight', () => {
    const startedAt = dayInMs - testSkipLimit;
    const expectedFinish = 10;
    const previousTime = startedAt + 1;

    const state = {
      clock: previousTime,
      timer: {
        expectedFinish,
        startedAt,
      },
    } as RuntimeState;

    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);

    state.clock = asTimeOfDay(state.clock - testSkipLimit);
    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);
  });

  it('finds skip forwards out of event', () => {
    const startedAt = 1000;
    const duration = 1000;
    const expectedFinish = startedAt + duration;
    const previousTime = expectedFinish - testSkipLimit / 2;

    const state = {
      clock: previousTime,
      timer: {
        expectedFinish,
        startedAt,
      },
    } as RuntimeState;

    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);

    state.clock = asTimeOfDay(state.clock + testSkipLimit + 1);
    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(true);
  });

  it('finds skip backwards out of event', () => {
    const startedAt = 1000;
    const duration = 1000;
    const expectedFinish = startedAt + duration;
    const previousTime = startedAt + testSkipLimit / 2;

    const state = {
      clock: previousTime,
      timer: {
        expectedFinish,
        startedAt,
      },
    } as RuntimeState;

    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);

    state.clock = asTimeOfDay(state.clock - testSkipLimit - 1);
    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(true);
  });

  it('finds skip forwards out of event across midnight', () => {
    const startedAt = dayInMs - testSkipLimit;
    const expectedFinish = 10;
    const previousTime = dayInMs - 3;

    const state = {
      clock: previousTime,
      timer: {
        expectedFinish,
        startedAt,
      },
    } as RuntimeState;

    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);

    state.clock = asTimeOfDay(testSkipLimit - 2);
    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(true);
  });

  it('finds skip backwards out of event across midnight', () => {
    const startedAt = dayInMs - testSkipLimit;
    const expectedFinish = 10;
    const previousTime = startedAt + 1;

    const state = {
      clock: previousTime,
      timer: {
        expectedFinish,
        startedAt,
      },
    } as RuntimeState;

    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);

    state.clock = asTimeOfDay(state.clock - testSkipLimit - 1);
    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(true);
  });

  it('handles events that cross midnight', () => {
    const startedAt = 23 * MILLIS_PER_HOUR + 50 * MILLIS_PER_MINUTE; // 23:50
    const expectedFinish = 1 * MILLIS_PER_HOUR + 50 * MILLIS_PER_MINUTE; // 01:50
    const clock = 14 * MILLIS_PER_MINUTE + 47 * MILLIS_PER_SECOND; // 00:14:47
    const previousTime = clock - 1021; // ~1 second ago

    const state = {
      clock,
      timer: {
        expectedFinish,
        startedAt,
      },
    } as RuntimeState;

    // Even though clock < startedAt numerically (00:14 < 23:50),
    // we're inside the overnight event, so this should NOT be a skip
    expect(skippedOutOfEvent(state, previousTime, 1000)).toBe(false);
  });

  it('correctly detects skip out of an event that crosses midnight', () => {
    // Event 23:50-01:50, clock jumps to 02:00 (outside event)
    const startedAt = 23 * MILLIS_PER_HOUR + 50 * MILLIS_PER_MINUTE; // 23:50
    const expectedFinish = 1 * MILLIS_PER_HOUR + 50 * MILLIS_PER_MINUTE; // 01:50
    const previousTime = 1 * MILLIS_PER_HOUR + 49 * MILLIS_PER_MINUTE; // 01:49
    const clock = 2 * MILLIS_PER_HOUR; // 02:00 (outside event)

    const state = {
      clock,
      timer: {
        expectedFinish,
        startedAt,
      },
    } as RuntimeState;

    // Clock jumped from 01:49 to 02:00 (11 min skip) and is now outside the event
    expect(skippedOutOfEvent(state, previousTime, 1000)).toBe(true);
  });
});

test('normaliseEndTime()', () => {
  const t1 = {
    start: 10,
    end: 20,
  };
  const t1_expected = 20;

  expect(normaliseEndTime(t1.start, t1.end)).toBe(t1_expected);

  const t2 = {
    start: 10 + dayInMs,
    end: 20,
  };
  const t2_expected = 20 + dayInMs;

  expect(normaliseEndTime(t2.start, t2.end)).toBe(t2_expected);

  const t3 = {
    start: 10,
    end: 10,
  };
  const t3_expected = 10;

  expect(normaliseEndTime(t3.start, t3.end)).toBe(t3_expected);
});

const makeRuntimeOffsetInput = (patch: Partial<RuntimeOffsetInput>): RuntimeOffsetInput => ({
  clock: tod(0),
  event: { countToEnd: false, timeStart: tod(100), dayOffset: 0 as Day },
  startedAt: null,
  current: dur(0),
  addedTime: dur(0),
  pausedAt: null,
  startDayOffset: 0 as Day,
  plannedStart: tod(100),
  actualStart: tod(100),
  ...patch,
});

describe('getRuntimeOffset()', () => {
  it('is the difference between scheduled and when we actually started', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({ clock: tod(150), startedAt: tod(150), actualStart: tod(150) }),
    );
    expect(absolute).toBe(50);
  });

  it('added time subtracts time offset (positive offset)', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        startedAt: tod(150), // we started 50ms delayed
        addedTime: dur(10), // we compensated with 10ms
        current: dur(10), // we are 10ms into the timer
        actualStart: tod(150),
      }),
    );
    expect(absolute).toBe(60);
  });

  it('considers running overtime (negative offset)', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        startedAt: tod(100), // we started ontime
        current: dur(-10), // we are 10 seconds over
      }),
    );
    expect(absolute).toBe(10);
  });

  it('paused time is delayed time (negative offset)', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        clock: tod(150),
        startedAt: tod(100), // started on time
        current: dur(25), // are 25ms into it
        pausedAt: tod(125), // we have been paused for 25ms (see clock)
      }),
    );
    expect(absolute).toBe(25);
  });

  it('counts a pause across midnight', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        clock: tod(1 * MILLIS_PER_MINUTE), // 00:01
        startedAt: tod(100), // started on time
        current: dur(25),
        pausedAt: tod(dayInMs - 1 * MILLIS_PER_MINUTE), // 23:59
      }),
    );
    expect(absolute).toBe(2 * MILLIS_PER_MINUTE);
  });

  it('accounts for a rundown started after midnight', () => {
    const plannedStart = tod(23 * MILLIS_PER_HOUR + 50 * MILLIS_PER_MINUTE); // 23:50
    const actualStart = tod(5 * MILLIS_PER_MINUTE); // 00:05 the day after
    const { absolute, relative } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        clock: actualStart,
        event: { countToEnd: false, timeStart: plannedStart, dayOffset: 0 as Day },
        startedAt: actualStart,
        current: dur(MILLIS_PER_HOUR),
        startDayOffset: 1 as Day,
        plannedStart,
        actualStart,
      }),
    );
    expect(absolute).toBe(15 * MILLIS_PER_MINUTE);
    expect(relative).toBe(0);
  });

  it('offset doesnt exist if we havent started', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        clock: tod(78480789),
        event: { countToEnd: false, timeStart: tod(77400000), dayOffset: 0 as Day },
        current: dur(3600000),
        startedAt: null,
        plannedStart: tod(77400000),
        actualStart: null,
      }),
    );
    expect(absolute).toBe(0);
  });

  it('with time-to-end, offsets dont exist if we are not in overtime', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        clock: tod(80000000), // 22:13:20
        event: { countToEnd: true, timeStart: tod(77400000), dayOffset: 0 as Day }, // 21:30:00
        current: dur(1600000),
        startedAt: tod(78000000),
        plannedStart: tod(77400000), // 21:30:00
        actualStart: tod(78000000), // 21:40:00
      }),
    );
    expect(absolute).toBe(0);
  });

  it('with time-to-end, offset is the overtime', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        clock: tod(82000000), // 22:46:40
        event: { countToEnd: true, timeStart: tod(77400000), dayOffset: 0 as Day }, // 21:30:00
        addedTime: dur(-200000),
        current: dur(-400000),
        startedAt: tod(78000000),
        plannedStart: tod(77400000), // 21:30:00
        actualStart: tod(78000000), // 21:40:00
      }),
    );
    expect(absolute).toBe(400000 - 200000); // <--- offset is always the overtime + added time
  });

  it('with time-to-end, paused time is not offset', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        clock: tod(80000000), // 22:13:20
        event: { countToEnd: true, timeStart: tod(77400000), dayOffset: 0 as Day }, // 21:30:00
        current: dur(1000000),
        startedAt: tod(78000000),
        pausedAt: tod(79000000),
        plannedStart: tod(77400000),
        actualStart: tod(78000000),
      }),
    );
    expect(absolute).toBe(0);
  });

  it('handles time-to-end started after the end time', () => {
    const clock = tod(82000000); // 22:46:40 <--- starting 16m 40s after the scheduled end
    const event = {
      countToEnd: true,
      timeStart: tod(77400000), // 21:30:00
      timeEnd: tod(81000000), // 22:30:00
      dayOffset: 0 as Day,
    };
    const startedAt = tod(82000000); // <--- started now

    const current = getCurrent({
      clock,
      event,
      startedAt,
      duration: dur(3600000),
      addedTime: dur(0),
      pausedAt: null,
    });
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        clock,
        event,
        current,
        startedAt,
        plannedStart: tod(77400000), // 21:30:00
        actualStart: tod(82000000), // 22:46:40 <--- started now
      }),
    );
    expect(millisToString(absolute)).toBe('00:16:40');
    expect(absolute).toBe(82000000 - 81000000); // <-- now - planned end
  });
});

describe('getRuntimeOffset() relative', () => {
  const makeInput = (timeStart: number, startedAt: number) =>
    makeRuntimeOffsetInput({
      event: { countToEnd: false, timeStart: tod(timeStart), dayOffset: 0 as Day },
      startedAt: tod(startedAt),
      plannedStart: tod(timeStart),
      actualStart: tod(startedAt),
    });

  it('relative offset is 0 when starting at the planed time', () => {
    const { absolute, relative } = getRuntimeOffset(makeInput(150, 150));
    expect(absolute).toBe(0);
    expect(relative).toBe(0);
  });
  it('relative offset is 0 when starting after the planed time', () => {
    const { absolute, relative } = getRuntimeOffset(makeInput(100, 150));
    expect(absolute).toBe(50);
    expect(relative).toBe(0);
  });
  it('relative offset is 0 when starting before the planed time', () => {
    const { absolute, relative } = getRuntimeOffset(makeInput(150, 100));
    expect(absolute).toBe(-50);
    expect(relative).toBe(0);
  });
});

describe('getTimerPhase()', () => {
  const event = { timeDanger: dur(100), timeWarning: dur(200) };
  const makeInput = (patch: Partial<TimerPhaseInput>): TimerPhaseInput => ({
    playback: Playback.Play,
    current: null,
    secondaryTimer: null,
    event,
    ...patch,
  });

  it('should be None if the timer is not running', () => {
    const phase = getTimerPhase(makeInput({ playback: Playback.Stop, event: null }));
    expect(phase).toBe(TimerPhase.None);
  });

  it('can be in overtime', () => {
    const phase = getTimerPhase(makeInput({ current: dur(-50) }));
    expect(phase).toBe(TimerPhase.Overtime);
  });

  it('can be danger', () => {
    const phase = getTimerPhase(makeInput({ current: dur(0) }));
    expect(phase).toBe(TimerPhase.Danger);
  });

  it('can be warning', () => {
    const phase = getTimerPhase(makeInput({ current: dur(150) }));
    expect(phase).toBe(TimerPhase.Warning);
  });

  it('is default if the timer is playing and there is none of the above', () => {
    const phase = getTimerPhase(makeInput({ current: dur(250) }));
    expect(phase).toBe(TimerPhase.Default);
  });

  it('keeps the phase while paused', () => {
    const phase = getTimerPhase(makeInput({ playback: Playback.Pause, current: dur(150) }));
    expect(phase).toBe(TimerPhase.Warning);
  });

  it('#1042 identifies waiting to roll', () => {
    const phase = getTimerPhase(makeInput({ playback: Playback.Roll, event: null, secondaryTimer: dur(168950) }));
    expect(phase).toBe(TimerPhase.Pending);
  });
});

describe('findDay()', () => {
  test('finds dayOffset', () => {
    //both have 1 hour offset but the clock are on different days
    expect(findDayOffset(0, 23 * MILLIS_PER_HOUR)).toBe(-1); //                 -> 23
    expect(findDayOffset(0, 13 * MILLIS_PER_HOUR)).toBe(-1); //                 -> 13
    expect(findDayOffset(0, 12 * MILLIS_PER_HOUR)).toBe(-1); //                 -> 12
    expect(findDayOffset(0, 11 * MILLIS_PER_HOUR)).toBe(0); //                 -> 11
    expect(findDayOffset(1 * MILLIS_PER_HOUR, 0)).toBe(0); //                  -> -1

    //both have 1 hour offset but the clock are on different days
    expect(findDayOffset(23 * MILLIS_PER_HOUR, 0)).toBe(1); //                  -> -23
    expect(findDayOffset(13 * MILLIS_PER_HOUR, 0)).toBe(1); //                  -> -13
    expect(findDayOffset(12 * MILLIS_PER_HOUR, 0)).toBe(0); //                  -> -12
    expect(findDayOffset(11 * MILLIS_PER_HOUR, 0)).toBe(0); //                  -> -11
    expect(findDayOffset(22 * MILLIS_PER_HOUR, 23 * MILLIS_PER_HOUR)).toBe(0); //   -> 1
  });
});

describe('getTimeToBoundary()', () => {
  const makeInput = (patch: Partial<TimeToBoundaryInput>): TimeToBoundaryInput => ({
    playback: Playback.Play,
    current: null,
    secondaryTimer: null,
    hasFinished: false,
    triggerAhead: dur(10),
    ...patch,
  });

  it.each([Playback.Stop, Playback.Armed, Playback.Pause])('returns null when playback is %s', (playback) => {
    expect(getTimeToBoundary(makeInput({ playback, current: dur(1000) }))).toBeNull();
  });

  it('returns null once the timer has finished', () => {
    expect(getTimeToBoundary(makeInput({ current: dur(-100), hasFinished: true }))).toBeNull();
  });

  it('anticipates the end of a running timer', () => {
    expect(getTimeToBoundary(makeInput({ playback: Playback.Play, current: dur(1000) }))).toBe(990);
    expect(getTimeToBoundary(makeInput({ playback: Playback.Roll, current: dur(1000) }))).toBe(990);
  });

  it('returns the pre-roll wait when waiting to roll', () => {
    expect(getTimeToBoundary(makeInput({ playback: Playback.Roll, secondaryTimer: dur(500) }))).toBe(500);
  });
});

describe('getExpectedTimes()', () => {
  const event = makeOntimeEvent({
    id: 'last',
    timeStart: 2 * MILLIS_PER_HOUR,
    duration: MILLIS_PER_HOUR,
    dayOffset: 0 as Day,
    delay: 0,
    countToEnd: false,
  });
  const linked = { event, accumulatedGap: 0, isLinkedToLoaded: true };
  const absoluteOffset = (offset: number) => ({ absolute: dur(offset), relative: dur(0) });

  const makeInput = (patch: Partial<ExpectedTimesInput>): ExpectedTimesInput => ({
    mode: OffsetMode.Absolute,
    offset: absoluteOffset(0),
    plannedStart: tod(MILLIS_PER_HOUR),
    actualStart: tod(MILLIS_PER_HOUR),
    currentDay: 0 as Day,
    group: null,
    flag: null,
    end: null,
    ...patch,
  });

  it('has no expected times without events to look ahead to', () => {
    expect(getExpectedTimes(makeInput({ offset: absoluteOffset(5 * MILLIS_PER_MINUTE) }))).toStrictEqual({
      expectedGroupEnd: null,
      expectedFlagStart: null,
      expectedRundownEnd: null,
    });
  });

  it('moves linked events by the offset', () => {
    const offset = 5 * MILLIS_PER_MINUTE;
    expect(
      getExpectedTimes(makeInput({ offset: absoluteOffset(offset), group: linked, flag: linked, end: linked })),
    ).toStrictEqual({
      expectedGroupEnd: 3 * MILLIS_PER_HOUR + offset,
      expectedFlagStart: 2 * MILLIS_PER_HOUR + offset,
      expectedRundownEnd: 3 * MILLIS_PER_HOUR + offset,
    });
  });

  it('lets gaps absorb the offset of unlinked events', () => {
    const unlinked = { event, accumulatedGap: 10 * MILLIS_PER_MINUTE, isLinkedToLoaded: false };
    const { expectedRundownEnd } = getExpectedTimes(
      makeInput({ offset: absoluteOffset(5 * MILLIS_PER_MINUTE), end: unlinked }),
    );
    expect(expectedRundownEnd).toBe(3 * MILLIS_PER_HOUR);
  });

  it('shifts the schedule to the actual start in relative mode', () => {
    const { expectedRundownEnd } = getExpectedTimes(
      makeInput({
        mode: OffsetMode.Relative,
        actualStart: tod(MILLIS_PER_HOUR + 5 * MILLIS_PER_MINUTE),
        end: linked,
      }),
    );
    expect(expectedRundownEnd).toBe(3 * MILLIS_PER_HOUR + 5 * MILLIS_PER_MINUTE);
  });

  it('applies the offset of the selected mode', () => {
    const offset = { absolute: dur(MILLIS_PER_HOUR), relative: dur(2 * MILLIS_PER_MINUTE) };
    const { expectedRundownEnd } = getExpectedTimes(makeInput({ mode: OffsetMode.Relative, offset, end: linked }));
    expect(expectedRundownEnd).toBe(3 * MILLIS_PER_HOUR + 2 * MILLIS_PER_MINUTE);
  });

  it('places events after midnight relative to the current day', () => {
    const afterMidnight = makeOntimeEvent({ ...event, timeStart: 30 * MILLIS_PER_MINUTE, dayOffset: 1 as Day });
    const end = { event: afterMidnight, accumulatedGap: 0, isLinkedToLoaded: true };

    expect(getExpectedTimes(makeInput({ end })).expectedRundownEnd).toBe(dayInMs + 90 * MILLIS_PER_MINUTE);
    expect(getExpectedTimes(makeInput({ currentDay: 1 as Day, end })).expectedRundownEnd).toBe(90 * MILLIS_PER_MINUTE);
  });

  it('keeps the planned end of a count-to-end event unless it would start after it', () => {
    const countToEnd = { ...linked, event: makeOntimeEvent({ ...event, countToEnd: true }) };

    expect(
      getExpectedTimes(makeInput({ offset: absoluteOffset(5 * MILLIS_PER_MINUTE), end: countToEnd }))
        .expectedRundownEnd,
    ).toBe(3 * MILLIS_PER_HOUR);
    expect(
      getExpectedTimes(makeInput({ offset: absoluteOffset(2 * MILLIS_PER_HOUR), end: countToEnd })).expectedRundownEnd,
    ).toBe(4 * MILLIS_PER_HOUR);
  });
});
