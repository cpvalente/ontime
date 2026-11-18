import { Day, Duration, Instant, Maybe, OffsetMode, Playback, TimeOfDay, TimerPhase } from 'ontime-types';
import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, MILLIS_PER_SECOND, dayInMs, millisToString } from 'ontime-utils';

import { makeOntimeEvent } from '../../../api-data/rundown/__mocks__/rundown.mocks.js';
import * as timeCore from '../../../lib/time-core/timeCore.js';
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
  normaliseEndTime,
  skippedOutOfEvent,
} from '../timer.utils.js';

const tod = (value: number) => value as TimeOfDay;
const dur = (value: number) => value as Duration;

// Nov 17 2026 - 00:00:00 GMT+0100
const instantToday = (value: number) => timeCore.toInstant(tod(value), 1794870000000 as Instant) as Instant;
// Nov 16 2026 - 00:00:00 GMT+0100
const instantYesterday = (value: number) => timeCore.toInstant(tod(value), 1794783600000 as Instant) as Instant;

describe('getElapsed()', () => {
  const makeInput = (patch: Partial<ElapsedInput>): ElapsedInput => ({
    epoch: instantToday(0),
    startedAt: null,
    pausedAt: null,
    pausedDuration: dur(0),
    ...patch,
  });

  it('is null if the timer has not started', () => {
    expect(getElapsed(makeInput({ epoch: instantToday(5 * MILLIS_PER_MINUTE) }))).toBeNull();
  });

  it('returns active elapsed time from startedAt', () => {
    const input = makeInput({
      epoch: instantToday(5 * MILLIS_PER_MINUTE),
      startedAt: instantToday(2 * MILLIS_PER_MINUTE),
    });
    expect(getElapsed(input)).toBe(3 * MILLIS_PER_MINUTE);
  });

  it('subtracts accumulated pause time', () => {
    const input = makeInput({
      epoch: instantToday(10 * MILLIS_PER_MINUTE),
      startedAt: instantToday(2 * MILLIS_PER_MINUTE),
      pausedDuration: dur(5 * MILLIS_PER_MINUTE),
    });
    expect(getElapsed(input)).toBe(3 * MILLIS_PER_MINUTE);
  });

  it('uses the current pause start while paused', () => {
    const input = makeInput({
      epoch: instantToday(10 * MILLIS_PER_MINUTE),
      startedAt: instantToday(2 * MILLIS_PER_MINUTE),
      pausedAt: instantToday(7 * MILLIS_PER_MINUTE),
      pausedDuration: dur(1 * MILLIS_PER_MINUTE),
    });
    expect(getElapsed(input)).toBe(4 * MILLIS_PER_MINUTE);
  });

  it('counts across midnight', () => {
    const input = makeInput({
      epoch: instantToday(3 * MILLIS_PER_MINUTE), // 00:03
      startedAt: instantYesterday(23 * MILLIS_PER_HOUR + 58 * MILLIS_PER_MINUTE), // 23:58
    });
    expect(getElapsed(input)).toBe(5 * MILLIS_PER_MINUTE);
  });

  it('counts a pause which started after midnight', () => {
    const input = makeInput({
      epoch: instantToday(10 * MILLIS_PER_MINUTE), // 00:10
      startedAt: instantYesterday(23 * MILLIS_PER_HOUR + 58 * MILLIS_PER_MINUTE), // 23:58
      pausedAt: instantToday(1 * MILLIS_PER_MINUTE), // 00:01
    });
    expect(getElapsed(input)).toBe(3 * MILLIS_PER_MINUTE);
  });
});

describe('getExpectedFinish()', () => {
  const makeInput = (patch: Partial<ExpectedFinishInput>): ExpectedFinishInput => ({
    epoch: instantToday(0),
    event: { countToEnd: false, timeStart: tod(0), dayOffset: 0 as Day },
    startedAt: null,
    duration: null,
    addedTime: dur(0),
    pausedAt: null,
    rundownStartEpoch: null,
    startDayOffset: null,
    ...patch,
  });

  it('is null if there is no event loaded', () => {
    expect(getExpectedFinish(makeInput({ event: null, startedAt: instantToday(10), duration: dur(10) }))).toBeNull();
  });
  it('is null if we havent started', () => {
    const calculatedFinish = getExpectedFinish(makeInput({ duration: dur(10) }));
    expect(calculatedFinish).toBeNull();
  });
  it('calculates the finish time', () => {
    const calculatedFinish = getExpectedFinish(makeInput({ duration: dur(10), startedAt: instantToday(1) }));
    expect(calculatedFinish).toBe(11);
  });
  it('adds paused and added times', () => {
    const calculatedFinish = getExpectedFinish(
      makeInput({ addedTime: dur(20), duration: dur(10), startedAt: instantToday(1) }),
    );
    expect(calculatedFinish).toBe(31);
  });
  it('added time could be negative', () => {
    const calculatedFinish = getExpectedFinish(
      makeInput({ addedTime: dur(-10), duration: dur(10), startedAt: instantToday(1) }),
    );
    expect(calculatedFinish).toBe(1);
  });
  it('user could add enough time for it to be negative', () => {
    const calculatedFinish = getExpectedFinish(
      makeInput({ addedTime: dur(-100), duration: dur(10), startedAt: instantToday(1) }),
    );
    expect(calculatedFinish).toBe(1);
  });
  it('timer can have no duration', () => {
    const calculatedFinish = getExpectedFinish(makeInput({ duration: dur(0), startedAt: instantToday(1) }));
    expect(calculatedFinish).toBe(1);
  });
  it('finish can be the day after', () => {
    const calculatedFinish = getExpectedFinish(makeInput({ duration: dur(dayInMs), startedAt: instantToday(10) }));
    expect(calculatedFinish).toBe(10);
  });
  it('pushes the finish by the time spent in the current pause', () => {
    const calculatedFinish = getExpectedFinish(
      makeInput({
        epoch: instantToday(10 * MILLIS_PER_MINUTE),
        startedAt: instantToday(0),
        duration: dur(20 * MILLIS_PER_MINUTE),
        pausedAt: instantToday(7 * MILLIS_PER_MINUTE),
      }),
    );
    expect(calculatedFinish).toBe(23 * MILLIS_PER_MINUTE);
  });
  it('counts a pause across midnight', () => {
    const calculatedFinish = getExpectedFinish(
      makeInput({
        epoch: instantToday(1 * MILLIS_PER_MINUTE), // 00:01
        startedAt: instantYesterday(23 * MILLIS_PER_HOUR - dayInMs), // 23:00
        duration: dur(2 * MILLIS_PER_HOUR),
        pausedAt: instantYesterday(dayInMs - 1 * MILLIS_PER_MINUTE), // 23:59
      }),
    );
    expect(calculatedFinish).toBe(1 * MILLIS_PER_HOUR + 2 * MILLIS_PER_MINUTE);
  });
  describe('on timers of type time-to-end', () => {
    it('finish time is as schedule + added time', () => {
      const calculatedFinish = getExpectedFinish(
        makeInput({
          event: { countToEnd: true, timeStart: tod(30), dayOffset: 0 as Day },
          addedTime: dur(10),
          duration: dur(dayInMs),
          startedAt: instantToday(10),
          rundownStartEpoch: instantToday(10),
          startDayOffset: 0 as Day,
        }),
      );
      expect(calculatedFinish).toBe(40);
    });
    it('handles events that finish the day after', () => {
      const calculatedFinish = getExpectedFinish(
        makeInput({
          event: { countToEnd: true, timeStart: tod(22 * MILLIS_PER_HOUR), dayOffset: 0 as Day }, // 22:00:00
          duration: dur(2 * MILLIS_PER_HOUR + 10 * MILLIS_PER_MINUTE), // 22:00:00 + 2h 10m -> 00:10:00
          startedAt: instantToday(79200000), // 22:00:00
          rundownStartEpoch: instantToday(79200000),
          startDayOffset: 0 as Day,
        }),
      );
      // expected finish is not a duration but a point in time
      expect(calculatedFinish).toBe(600000); // 00:10:00
    });
    it('pushes the finish by the time spent in the current pause', () => {
      const calculatedFinish = getExpectedFinish(
        makeInput({
          event: { countToEnd: true, timeStart: tod(0), dayOffset: 0 as Day },
          duration: dur(100),
          epoch: instantToday(50),
          startedAt: instantToday(10),
          rundownStartEpoch: instantToday(10),
          startDayOffset: 0 as Day,
          pausedAt: instantToday(30),
        }),
      );
      expect(calculatedFinish).toBe(120);
    });
    it('anchors to the rundown day after midnight', () => {
      const calculatedFinish = getExpectedFinish(
        makeInput({
          event: { countToEnd: true, timeStart: tod(23 * MILLIS_PER_HOUR), dayOffset: 0 as Day }, // 23:00:00
          duration: dur(2 * MILLIS_PER_HOUR), // 23:00:00 + 2h -> 01:00:00
          epoch: instantToday(30 * MILLIS_PER_MINUTE), // 00:30:00
          startedAt: instantYesterday(23 * MILLIS_PER_HOUR),
          rundownStartEpoch: instantYesterday(22 * MILLIS_PER_HOUR),
          startDayOffset: 0 as Day,
        }),
      );
      expect(calculatedFinish).toBe(1 * MILLIS_PER_HOUR);
    });
  });
});

describe('getCurrent()', () => {
  const makeInput = (patch: Partial<CurrentInput>): CurrentInput => ({
    epoch: instantToday(0),
    event: { countToEnd: false, timeStart: tod(0), dayOffset: 0 as Day },
    startedAt: null,
    duration: dur(0),
    addedTime: dur(0),
    pausedAt: null,
    rundownStartEpoch: null,
    startDayOffset: null,
    ...patch,
  });

  it('is duration if it hasnt started', () => {
    const current = getCurrent(makeInput({ addedTime: dur(10), duration: dur(111) }));
    expect(current).toBe(111);
  });
  it('is the remaining time in clock', () => {
    const current = getCurrent(makeInput({ epoch: instantToday(1), duration: dur(10), startedAt: instantToday(0) }));
    expect(current).toBe(9);
  });
  it('accounts for added times', () => {
    const current = getCurrent(
      makeInput({ epoch: instantToday(1), addedTime: dur(10), duration: dur(10), startedAt: instantToday(0) }),
    );
    expect(current).toBe(19);
  });
  it('counts over midnight', () => {
    const current = getCurrent(
      makeInput({ epoch: instantYesterday(10), duration: dur(dayInMs + 10), startedAt: instantYesterday(10) }),
    );
    expect(current).toBe(dayInMs + 10);
  });
  it('rolls over midnight', () => {
    const current = getCurrent(
      makeInput({ epoch: instantToday(5), duration: dur(dayInMs + 10), startedAt: instantYesterday(10) }),
    );
    expect(current).toBe(15);
  });
  it('midnight holds delays', () => {
    const current = getCurrent(
      makeInput({
        epoch: instantToday(5),
        addedTime: dur(20),
        duration: dur(dayInMs + 10),
        startedAt: instantYesterday(10),
      }),
    );
    expect(current).toBe(35);
  });
  it('holds at the pause time while paused', () => {
    const current = getCurrent(
      makeInput({
        epoch: instantToday(9),
        addedTime: dur(3),
        duration: dur(10),
        startedAt: instantToday(0),
        pausedAt: instantToday(4),
      }),
    );
    expect(current).toBe(9);
  });
  it('holds a pause which started after midnight', () => {
    const current = getCurrent(
      makeInput({
        epoch: instantToday(50),
        duration: dur(100),
        startedAt: instantYesterday(dayInMs - 5),
        pausedAt: instantToday(5),
      }),
    );
    expect(current).toBe(90);
  });

  describe('on timers of type count-to-end', () => {
    it('current time is the time to end even if it hasnt started, this is weird, but by design', () => {
      const current = getCurrent(
        makeInput({
          event: { countToEnd: true, timeStart: tod(0), dayOffset: 0 as Day },
          epoch: instantToday(30),
          duration: dur(100),
        }),
      );
      expect(current).toBe(70);
    });

    it('current time is the time to end', () => {
      const current = getCurrent(
        makeInput({
          event: { countToEnd: true, timeStart: tod(0), dayOffset: 0 as Day },
          epoch: instantToday(30),
          duration: dur(100),
          startedAt: instantToday(10),
          rundownStartEpoch: instantToday(10),
          startDayOffset: 0 as Day,
        }),
      );
      expect(current).toBe(70);
    });

    it('current time is the time to end + added time', () => {
      const current = getCurrent(
        makeInput({
          event: { countToEnd: true, timeStart: tod(0), dayOffset: 0 as Day },
          epoch: instantToday(30),
          addedTime: dur(7),
          duration: dur(100),
          startedAt: instantToday(10),
          rundownStartEpoch: instantToday(10),
          startDayOffset: 0 as Day,
        }),
      );
      expect(current).toBe(77);
    });

    it('keeps counting to the end while paused', () => {
      const current = getCurrent(
        makeInput({
          event: { countToEnd: true, timeStart: tod(0), dayOffset: 0 as Day },
          epoch: instantToday(30),
          duration: dur(100),
          startedAt: instantToday(10),
          rundownStartEpoch: instantToday(10),
          startDayOffset: 0 as Day,
          pausedAt: instantToday(20),
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
            dayOffset: 0 as Day,
          },
          duration: dur(2 * MILLIS_PER_HOUR + 10 * MILLIS_PER_MINUTE), // 22:00:00 + 2h 10m -> 00:10:00
          epoch: instantToday(79500000), // 22:05:00
          startedAt: instantToday(79200000), // 22:00:00
          rundownStartEpoch: instantToday(79200000),
          startDayOffset: 0 as Day,
        }),
      );
      expect(current).toBe(dayInMs - 79500000 + 600000);
    });

    it('handles events that were started late', () => {
      const current = getCurrent(
        makeInput({
          epoch: instantToday(82000000), // 22:46:40 <--- starting 16 min after the scheduled end
          event: {
            countToEnd: true,
            timeStart: tod(77400000), // 21:30:00
            dayOffset: 0 as Day,
          },
          duration: dur(1 * MILLIS_PER_HOUR), // 21:30:00 + 1h -> 22:30:00
          startedAt: instantToday(79200000), // 22:00:00
          rundownStartEpoch: instantToday(79200000),
          startDayOffset: 0 as Day,
        }),
      );
      expect(current).toBe(81000000 - 82000000); // <-- planned end - now
    });

    it('anchors to the rundown day after midnight', () => {
      const current = getCurrent(
        makeInput({
          event: { countToEnd: true, timeStart: tod(23 * MILLIS_PER_HOUR), dayOffset: 0 as Day }, // 23:00:00
          duration: dur(2 * MILLIS_PER_HOUR), // 23:00:00 + 2h -> 01:00:00
          epoch: instantToday(30 * MILLIS_PER_MINUTE), // 00:30:00
          startedAt: instantYesterday(23 * MILLIS_PER_HOUR),
          rundownStartEpoch: instantYesterday(22 * MILLIS_PER_HOUR),
          startDayOffset: 0 as Day,
        }),
      );
      expect(current).toBe(30 * MILLIS_PER_MINUTE);
    });
  });
});

describe('getExpectedFinish() and getCurrentTime() combined', () => {
  const makeInput = (clock: number, addedTime: number): CurrentInput => ({
    epoch: instantToday(clock),
    event: { countToEnd: false, timeStart: tod(0), dayOffset: 0 as Day },
    startedAt: instantToday(0),
    duration: dur(10),
    addedTime: dur(addedTime),
    pausedAt: null,
    rundownStartEpoch: null,
    startDayOffset: null,
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

describe('skippedOutOfEvent()', () => {
  const skipLimit = 32;
  /** an event running from startedAt to end, seen at epoch */
  const makeState = (epoch: Instant, startedAt: Maybe<Instant>, end: Instant) =>
    ({ _epoch: epoch, _timer: { startedAt }, timer: { current: end - epoch } }) as unknown as RuntimeState;

  const startedAt = instantToday(1000);
  const end = instantToday(2000);

  it('is false if the timer has not started', () => {
    const state = makeState(instantToday(5000), null, end);
    expect(skippedOutOfEvent(state, instantToday(0), skipLimit)).toBe(false);
  });

  it('does not consider an event end as a skip', () => {
    const state = makeState(instantToday(2000 + skipLimit / 2), startedAt, end);
    expect(skippedOutOfEvent(state, instantToday(2000 - skipLimit / 2), skipLimit)).toBe(false);
  });

  it('allows moving backwards inside an event', () => {
    const state = makeState(instantToday(1000 + skipLimit / 2), startedAt, end);
    expect(skippedOutOfEvent(state, instantToday(1500), skipLimit)).toBe(false);
  });

  it('finds skip forwards out of event', () => {
    const state = makeState(instantToday(2000 + skipLimit), startedAt, end);
    expect(skippedOutOfEvent(state, instantToday(2000 - 1), skipLimit)).toBe(true);
  });

  it('finds skip backwards out of event', () => {
    const state = makeState(instantToday(1000 - skipLimit), startedAt, end);
    expect(skippedOutOfEvent(state, instantToday(1000 + 1), skipLimit)).toBe(true);
  });

  it('handles events that cross midnight', () => {
    const epoch = instantToday(14 * MILLIS_PER_MINUTE + 47 * MILLIS_PER_SECOND); // 00:14:47
    const state = makeState(
      epoch,
      instantYesterday(23 * MILLIS_PER_HOUR + 50 * MILLIS_PER_MINUTE), // 23:50
      instantToday(1 * MILLIS_PER_HOUR + 50 * MILLIS_PER_MINUTE), // 01:50
    );
    expect(skippedOutOfEvent(state, (epoch - 1021) as Instant, 1000)).toBe(false);
  });

  it('finds skip out of an event that crosses midnight', () => {
    const state = makeState(
      instantToday(2 * MILLIS_PER_HOUR), // 02:00
      instantYesterday(23 * MILLIS_PER_HOUR + 50 * MILLIS_PER_MINUTE), // 23:50
      instantToday(1 * MILLIS_PER_HOUR + 50 * MILLIS_PER_MINUTE), // 01:50
    );
    expect(skippedOutOfEvent(state, instantToday(1 * MILLIS_PER_HOUR + 49 * MILLIS_PER_MINUTE), 1000)).toBe(true);
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
  epoch: instantToday(0),
  event: { countToEnd: false, timeStart: tod(100), dayOffset: 0 as Day },
  startedAt: null,
  current: dur(0),
  addedTime: dur(0),
  pausedAt: null,
  startDayOffset: 0 as Day,
  plannedStart: tod(100),
  rundownStartEpoch: instantToday(100),
  ...patch,
});

describe('getRuntimeOffset()', () => {
  it('is the difference between scheduled and when we actually started', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        epoch: instantToday(150),
        startedAt: instantToday(150),
        rundownStartEpoch: instantToday(150),
      }),
    );
    expect(absolute).toBe(50);
  });

  it('added time subtracts time offset (positive offset)', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        epoch: instantToday(160),
        startedAt: instantToday(150), // we started 50ms delayed
        addedTime: dur(10), // we compensated with 10ms
        current: dur(10), // we are 10ms into the timer
        rundownStartEpoch: instantToday(150),
      }),
    );
    expect(absolute).toBe(60);
  });

  it('considers running overtime (negative offset)', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        startedAt: instantToday(100), // we started ontime
        current: dur(-10), // we are 10 seconds over
      }),
    );
    expect(absolute).toBe(10);
  });

  it('paused time is delayed time (negative offset)', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        epoch: instantToday(150),
        startedAt: instantToday(100), // started on time
        current: dur(25), // are 25ms into it
        pausedAt: instantToday(125), // we have been paused for 25ms (see clock)
      }),
    );
    expect(absolute).toBe(25);
  });

  it('counts a pause across midnight', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        epoch: instantToday(1 * MILLIS_PER_MINUTE), // 00:01
        current: dur(25),
        startedAt: instantYesterday(100), // started on time
        rundownStartEpoch: instantYesterday(100),
        pausedAt: instantYesterday(23 * MILLIS_PER_HOUR + 59 * MILLIS_PER_MINUTE), // 23:59
      }),
    );
    expect(absolute).toBe(2 * MILLIS_PER_MINUTE);
  });

  it('accounts for a rundown started after midnight', () => {
    const timeStart = tod(23 * MILLIS_PER_HOUR + 50 * MILLIS_PER_MINUTE); // 23:50
    const actualStart = instantToday(5 * MILLIS_PER_MINUTE); // 00:05 the day after
    const { absolute, relative } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        epoch: actualStart,
        event: { countToEnd: false, timeStart, dayOffset: 0 as Day },
        startedAt: actualStart,
        current: dur(MILLIS_PER_HOUR),
        startDayOffset: 1 as Day,
        plannedStart: timeStart,
        rundownStartEpoch: actualStart,
      }),
    );
    expect(absolute).toBe(15 * MILLIS_PER_MINUTE);
    expect(relative).toBe(0);
  });

  it('offset doesnt exist if we havent started', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        epoch: instantToday(78480789),
        event: { countToEnd: false, timeStart: tod(77400000), dayOffset: 0 as Day },
        current: dur(3600000),
        startedAt: null,
        plannedStart: tod(77400000),
        rundownStartEpoch: null,
      }),
    );
    expect(absolute).toBe(0);
  });

  it('with time-to-end, offsets dont exist if we are not in overtime', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        epoch: instantToday(80000000), // 22:13:20
        event: { countToEnd: true, timeStart: tod(77400000), dayOffset: 0 as Day }, // 21:30:00
        current: dur(1600000),
        rundownStartEpoch: instantToday(78000000),
      }),
    );
    expect(absolute).toBe(0);
  });

  it('with time-to-end, offset is the overtime', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        epoch: instantToday(82000000), // 22:46:40
        event: { countToEnd: true, timeStart: tod(77400000), dayOffset: 0 as Day }, // 21:30:00
        addedTime: dur(-200000),
        current: dur(-400000),
        startedAt: instantToday(78000000),
        plannedStart: tod(77400000), // 21:30:00
        rundownStartEpoch: instantToday(78000000), // 21:40:00
      }),
    );
    expect(absolute).toBe(400000 - 200000); // <--- offset is always the overtime + added time
  });

  it('with time-to-end, paused time is not offset', () => {
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        epoch: instantToday(80000000), // 22:13:20
        event: { countToEnd: true, timeStart: tod(77400000), dayOffset: 0 as Day }, // 21:30:00
        current: dur(1000000),
        startedAt: instantToday(78000000),
        pausedAt: instantToday(79000000),
        plannedStart: tod(77400000),
        rundownStartEpoch: instantToday(78000000),
      }),
    );
    expect(absolute).toBe(0);
  });

  it('handles time-to-end started after the end time', () => {
    const epoch = instantToday(82000000); // 22:46:40 <--- starting 16m 40s after the scheduled end
    const event = {
      countToEnd: true,
      timeStart: tod(77400000), // 21:30:00
      timeEnd: tod(81000000), // 22:30:00
      dayOffset: 0 as Day,
    };
    const startedAt = instantToday(82000000); // <--- started now

    const current = getCurrent({
      epoch,
      event,
      startedAt,
      duration: dur(3600000),
      addedTime: dur(0),
      pausedAt: null,
      rundownStartEpoch: startedAt,
      startDayOffset: 0 as Day,
    });
    const { absolute } = getRuntimeOffset(
      makeRuntimeOffsetInput({
        epoch,
        event,
        current,
        startedAt,
        plannedStart: tod(77400000), // 21:30:00
        rundownStartEpoch: instantToday(82000000), // 22:46:40 <--- started now
      }),
    );
    expect(millisToString(absolute)).toBe('00:16:40');
    expect(absolute).toBe(82000000 - 81000000); // <-- now - planned end
  });
});

describe('getRuntimeOffset() relative', () => {
  /** rundown planned to start at 10:00, playing an event planned at 11:00 */
  const makeInput = (patch: Partial<RuntimeOffsetInput>) =>
    makeRuntimeOffsetInput({
      event: { countToEnd: false, timeStart: tod(11 * MILLIS_PER_HOUR), dayOffset: 0 as Day },
      current: dur(MILLIS_PER_HOUR),
      plannedStart: tod(10 * MILLIS_PER_HOUR),
      ...patch,
    });

  it.each([
    { label: 'on time', rundownStart: 10 * MILLIS_PER_HOUR, absolute: 0 },
    { label: 'late', rundownStart: 10 * MILLIS_PER_HOUR + 5 * MILLIS_PER_MINUTE, absolute: 5 * MILLIS_PER_MINUTE },
    { label: 'early', rundownStart: 9 * MILLIS_PER_HOUR + 55 * MILLIS_PER_MINUTE, absolute: -5 * MILLIS_PER_MINUTE },
  ])('is 0 in the first event when the rundown starts $label', ({ rundownStart, absolute }) => {
    const offset = getRuntimeOffset(
      makeInput({
        event: { countToEnd: false, timeStart: tod(10 * MILLIS_PER_HOUR), dayOffset: 0 as Day },
        epoch: instantToday(rundownStart),
        startedAt: instantToday(rundownStart),
        rundownStartEpoch: instantToday(rundownStart),
      }),
    );
    expect(offset).toStrictEqual({ absolute, relative: 0 });
  });

  it.each([
    {
      label: 'late, event keeps the delay',
      rundownStart: 10 * MILLIS_PER_HOUR + 5 * MILLIS_PER_MINUTE,
      eventStart: 11 * MILLIS_PER_HOUR + 5 * MILLIS_PER_MINUTE,
      absolute: 5,
      relative: 0,
    },
    {
      label: 'late, event caught up',
      rundownStart: 10 * MILLIS_PER_HOUR + 5 * MILLIS_PER_MINUTE,
      eventStart: 11 * MILLIS_PER_HOUR + 2 * MILLIS_PER_MINUTE,
      absolute: 2,
      relative: -3,
    },
    {
      label: 'early, event on time',
      rundownStart: 9 * MILLIS_PER_HOUR + 55 * MILLIS_PER_MINUTE,
      eventStart: 11 * MILLIS_PER_HOUR,
      absolute: 0,
      relative: 5,
    },
  ])('is measured from the actual rundown start: $label', ({ rundownStart, eventStart, absolute, relative }) => {
    const offset = getRuntimeOffset(
      makeInput({
        epoch: instantToday(eventStart),
        startedAt: instantToday(eventStart),
        rundownStartEpoch: instantToday(rundownStart),
      }),
    );
    expect(offset).toStrictEqual({ absolute: absolute * MILLIS_PER_MINUTE, relative: relative * MILLIS_PER_MINUTE });
  });

  it('handles a rundown started late, after midnight', () => {
    const { absolute, relative } = getRuntimeOffset(
      makeInput({
        event: { countToEnd: false, timeStart: tod(30 * MILLIS_PER_MINUTE), dayOffset: 1 as Day },
        epoch: instantToday(40 * MILLIS_PER_MINUTE),
        startedAt: instantToday(40 * MILLIS_PER_MINUTE),
        startDayOffset: 1 as Day,
        plannedStart: tod(23 * MILLIS_PER_HOUR + 50 * MILLIS_PER_MINUTE),
        rundownStartEpoch: instantToday(5 * MILLIS_PER_MINUTE),
      }),
    );
    expect(absolute).toBe(10 * MILLIS_PER_MINUTE);
    expect(relative).toBe(-5 * MILLIS_PER_MINUTE);
  });

  it('handles a rundown started after midnight across the spring DST change', () => {
    // Europe/Copenhagen skips 02:00 -> 03:00 on Mar 29 2026, the day the rundown was planned
    const actualStart = new Date(2026, 2, 30, 0, 5).getTime() as Instant; // Mar 30 00:05
    const { absolute, relative } = getRuntimeOffset(
      makeInput({
        event: {
          countToEnd: false,
          timeStart: tod(23 * MILLIS_PER_HOUR + 50 * MILLIS_PER_MINUTE),
          dayOffset: 0 as Day,
        },
        epoch: actualStart,
        startedAt: actualStart,
        startDayOffset: 1 as Day,
        plannedStart: tod(23 * MILLIS_PER_HOUR + 50 * MILLIS_PER_MINUTE),
        rundownStartEpoch: actualStart,
      }),
    );
    expect(absolute).toBe(15 * MILLIS_PER_MINUTE);
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

  it('issue #1042 identifies waiting to roll', () => {
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
