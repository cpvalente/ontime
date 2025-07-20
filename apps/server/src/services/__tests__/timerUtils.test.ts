import { dayInMs, millisToString } from 'ontime-utils';
import { EndAction, Playback, TimeStrategy, TimerPhase, TimerType } from 'ontime-types';

import {
  getCurrent,
  getExpectedFinish,
  getRuntimeOffset,
  getTimerPhase,
  normaliseEndTime,
  skippedOutOfEvent,
} from '../timerUtils.js';
import type { RuntimeState } from '../../stores/runtimeState.js';

describe('getExpectedFinish()', () => {
  it('is null if we havent started', () => {
    const state = {
      eventNow: {
        timeEnd: 10,
        timerType: TimerType.CountDown,
      },
      timer: {
        addedTime: 0,
        duration: 10,
        startedAt: null,
      },
      _timer: {
        pausedAt: null,
        hasFinished: false,
      },
    } as RuntimeState;
    const calculatedFinish = getExpectedFinish(state);
    expect(calculatedFinish).toBe(null);
  });
  it('is hasFinished if defined', () => {
    const state = {
      eventNow: {
        timeEnd: 20,
        timerType: TimerType.CountDown,
      },
      timer: {
        addedTime: 0,
        duration: 10,
        startedAt: 10,
      },
      _timer: {
        pausedAt: null,
        hasFinished: true,
      },
    } as RuntimeState;
    const calculatedFinish = getExpectedFinish(state);
    expect(calculatedFinish).toBe(20);
  });
  it('calculates the finish time', () => {
    const state = {
      eventNow: {
        timeEnd: 11,
        timerType: TimerType.CountDown,
      },
      timer: {
        addedTime: 0,
        duration: 10,
        startedAt: 1,
      },
      _timer: {
        pausedAt: null,
        hasFinished: false,
      },
    } as RuntimeState;
    const calculatedFinish = getExpectedFinish(state);
    expect(calculatedFinish).toBe(11);
  });
  it('adds paused and added times', () => {
    const state = {
      eventNow: {
        timeEnd: 11,
        timerType: TimerType.CountDown,
      },
      timer: {
        addedTime: 20,
        duration: 10,
        startedAt: 1,
      },
      _timer: {
        pausedAt: null,
        hasFinished: false,
      },
    } as RuntimeState;

    const calculatedFinish = getExpectedFinish(state);
    expect(calculatedFinish).toBe(31);
  });
  it('added time could be negative', () => {
    const state = {
      eventNow: {
        timeEnd: 11,
        timerType: TimerType.CountDown,
      },
      timer: {
        addedTime: -10,
        duration: 10,
        startedAt: 1,
      },
      _timer: {
        pausedAt: null,
        hasFinished: false,
      },
    } as RuntimeState;

    const calculatedFinish = getExpectedFinish(state);
    expect(calculatedFinish).toBe(1);
  });
  it('user could add enough time for it to be negative', () => {
    const state = {
      eventNow: {
        timeEnd: 11,
        timerType: TimerType.CountDown,
      },
      timer: {
        addedTime: -100,
        duration: 10,
        startedAt: 1,
      },
      _timer: {
        pausedAt: null,
        hasFinished: false,
      },
    } as RuntimeState;

    const calculatedFinish = getExpectedFinish(state);
    expect(calculatedFinish).toBe(1);
  });
  it('timer can have no duration', () => {
    const state = {
      eventNow: {
        timeEnd: 0,
        timerType: TimerType.CountDown,
      },
      timer: {
        addedTime: 0,
        duration: 0,
        startedAt: 1,
      },
      _timer: {
        pausedAt: null,
        hasFinished: false,
      },
    } as RuntimeState;

    const calculatedFinish = getExpectedFinish(state);
    expect(calculatedFinish).toBe(1);
  });
  it('finish can be the day after', () => {
    const state = {
      eventNow: {
        timeEnd: 10,
        timerType: TimerType.CountDown,
      },
      timer: {
        addedTime: 0,
        duration: dayInMs,
        startedAt: 10,
      },
      _timer: {
        pausedAt: null,
        hasFinished: false,
      },
    } as RuntimeState;

    const calculatedFinish = getExpectedFinish(state);
    expect(calculatedFinish).toBe(10);
  });
  describe('on timers of type time-to-end', () => {
    it('finish time is as schedule + added time', () => {
      const state = {
        eventNow: {
          timeEnd: 30,
          countToEnd: true,
        },
        timer: {
          addedTime: 10,
          duration: dayInMs,
          startedAt: 10,
        },
        _timer: {
          pausedAt: null,
          hasFinished: false,
        },
      } as RuntimeState;

      const calculatedFinish = getExpectedFinish(state);
      expect(calculatedFinish).toBe(40);
    });
    it('handles events that finish the day after', () => {
      const state = {
        eventNow: {
          timeEnd: 600000, // 00:10:00
          countToEnd: true,
        },
        timer: {
          addedTime: 0,
          startedAt: 79200000, // 22:00:00
        },
        _timer: {
          pausedAt: null,
          hasFinished: false,
        },
        rundown: {
          actualStart: 79200000,
          plannedEnd: 600000,
        },
      } as RuntimeState;

      const calculatedFinish = getExpectedFinish(state);
      // expected finish is not a duration but a point in time
      expect(calculatedFinish).toBe(600000);
    });
  });
});

describe('getCurrent()', () => {
  it('is duration if it hasnt started', () => {
    const state = {
      eventNow: {
        timeEnd: 30,
        timerType: TimerType.CountDown,
      },
      clock: 0,
      timer: {
        addedTime: 10,
        duration: 111, // <-- we take the duration value
        startedAt: null,
      },
      _timer: {
        pausedAt: null,
        hasFinished: false,
      },
    } as RuntimeState;

    const current = getCurrent(state);
    expect(current).toBe(111);
  });
  it('is the remaining time in clock', () => {
    const state = {
      eventNow: {
        timeEnd: 10,
        timerType: TimerType.CountDown,
      },
      clock: 1,
      timer: {
        addedTime: 0,
        duration: 10,
        startedAt: 0,
      },
      _timer: {
        pausedAt: null,
        hasFinished: false,
      },
    } as RuntimeState;

    const current = getCurrent(state);
    expect(current).toBe(9);
  });
  it('accounts for added times', () => {
    const state = {
      eventNow: {
        timeEnd: 10,
        timerType: TimerType.CountDown,
      },
      clock: 1,
      timer: {
        addedTime: 10,
        duration: 10,
        startedAt: 0,
      },
      _timer: {
        pausedAt: null,
        hasFinished: false,
      },
    } as RuntimeState;

    const current = getCurrent(state);
    expect(current).toBe(19);
  });
  it('counts over midnight', () => {
    const state = {
      eventNow: {
        timeEnd: 20,
        timerType: TimerType.CountDown,
      },
      clock: 10,
      timer: {
        addedTime: 0,
        duration: dayInMs + 10,
        startedAt: 10,
      },
      _timer: {
        pausedAt: null,
        hasFinished: false,
      },
    } as RuntimeState;

    const current = getCurrent(state);
    expect(current).toBe(dayInMs + 10);
  });
  it('rolls over midnight', () => {
    const state = {
      eventNow: {
        timeEnd: 20,
        timerType: TimerType.CountDown,
      },
      clock: 5,
      timer: {
        addedTime: 0,
        duration: dayInMs + 10,
        startedAt: 10,
      },
      _timer: {
        pausedAt: null,
        hasFinished: false,
      },
    } as RuntimeState;

    const current = getCurrent(state);
    expect(current).toBe(15);
  });
  it('midnight holds delays', () => {
    const state = {
      eventNow: {
        timeEnd: 20,
        timerType: TimerType.CountDown,
      },
      clock: 5,
      timer: {
        addedTime: 20,
        duration: dayInMs + 10,
        startedAt: 10,
      },
      _timer: {
        pausedAt: null,
        hasFinished: false,
      },
    } as RuntimeState;

    const current = getCurrent(state);
    expect(current).toBe(35);
  });

  describe('on timers of type count-to-end', () => {
    it('current time is the time to end even if it hasnt started, this is weird, but by design', () => {
      const state = {
        eventNow: {
          timeEnd: 100,
          countToEnd: true,
        },
        clock: 30,
        timer: {
          addedTime: 0,
          duration: 100,
          startedAt: null,
        },
        rundown: {
          plannedEnd: null,
        },
        _timer: {
          pausedAt: null,
          hasFinished: false,
        },
      } as RuntimeState;

      const current = getCurrent(state);
      expect(current).toBe(70);
    });

    it('current time is the time to end', () => {
      const state = {
        eventNow: {
          timeEnd: 100,
          countToEnd: true,
        },
        clock: 30,
        timer: {
          addedTime: 0,
          duration: 100,
          startedAt: 10,
        },
        rundown: {
          plannedEnd: 100,
        },
        _timer: {
          pausedAt: null,
          hasFinished: false,
        },
      } as RuntimeState;

      const current = getCurrent(state);
      expect(current).toBe(70);
    });

    it('current time is the time to end + added time', () => {
      const state = {
        eventNow: {
          timeEnd: 100,
          countToEnd: true,
        },
        clock: 30,
        timer: {
          addedTime: 7,
          duration: 100,
          startedAt: 10,
        },
        rundown: {
          plannedEnd: 100,
        },
        _timer: {
          pausedAt: null,
          hasFinished: false,
        },
      } as RuntimeState;

      const current = getCurrent(state);
      expect(current).toBe(77);
    });

    it('handles events that finish the day after', () => {
      const state = {
        eventNow: {
          timeStart: 79200000, // 22:00:00
          timeEnd: 600000, // 00:10:00
          countToEnd: true,
        },
        clock: 79500000, // 22:05:00
        timer: {
          addedTime: 0,
          duration: Infinity, // not relevant,
          startedAt: 79200000, // 22:00:00
        },
        rundown: {
          actualStart: 79200000,
          plannedEnd: 600000,
        },
        _timer: {
          pausedAt: null,
          hasFinished: false,
        },
      } as RuntimeState;

      const current = getCurrent(state);
      expect(current).toBe(dayInMs - 79500000 + 600000);
    });

    it('handles events that were started late', () => {
      const state = {
        clock: 82000000, // 22:46:40 <--- starting 16 min after the scheduled end
        eventNow: {
          timeStart: 77400000, // 21:30:00
          timeEnd: 81000000, // 22:30:00
          duration: 3600000, // 01:00:00
          countToEnd: true,
        },
        timer: {
          addedTime: 0,
          duration: Infinity, // not relevant,
          startedAt: 79200000, // 22:00:00
        },
        rundown: {
          actualStart: 82000000, // 22:46:40 <--- started now
          plannedEnd: 81000000, // 22:30:00
        },
        _timer: {
          pausedAt: null,
          hasFinished: false,
        },
      } as RuntimeState;

      const current = getCurrent(state);
      expect(current).toBe(81000000 - 82000000); // <-- planned end - now
    });
  });
});

describe('getExpectedFinish() and getCurrentTime() combined', () => {
  it('without added times, they combine to be duration', () => {
    const duration = 10;
    const state = {
      eventNow: {
        timeEnd: 10,
        timerType: TimerType.CountDown,
      },
      clock: 0,
      timer: {
        addedTime: 0,
        duration,
        startedAt: 0,
      },
      _timer: {
        pausedAt: null,
        hasFinished: false,
      },
    } as RuntimeState;

    const expectedFinish = getExpectedFinish(state);
    const current = getCurrent(state);

    const elapsed = duration - current;
    expect(expectedFinish).toBe(10);
    expect(elapsed).toBe(0);
    expect(current).toBe(10);
    expect(elapsed + current).toBe(10);
  });
  it('added times influence expected finish', () => {
    const duration = 10;
    const state = {
      eventNow: {
        timeEnd: 10,
        timerType: TimerType.CountDown,
      },
      clock: 5,
      timer: {
        addedTime: 3,
        duration,
        startedAt: 0,
      },
      _timer: {
        pausedAt: null,
        hasFinished: false,
      },
    } as RuntimeState;

    const expectedFinish = getExpectedFinish(state);
    const current = getCurrent(state);

    const elapsed = duration - current;
    expect(expectedFinish).toBe(13);
    expect(elapsed).toBe(2);
    expect(current).toBe(8);
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

    state.clock += testSkipLimit;
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

    state.clock += testSkipLimit;
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

    state.clock = testSkipLimit - 2;
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

    state.clock -= testSkipLimit;
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

    state.clock += testSkipLimit + 1;
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

    state.clock -= testSkipLimit + 1;
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

    state.clock = testSkipLimit - 2;
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

    state.clock -= testSkipLimit + 1;
    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(true);
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

describe('getRuntimeOffset()', () => {
  it('is the difference between scheduled and when we actually started', () => {
    const state = {
      eventNow: {
        id: '1',
        timeStart: 100,
      },
      timer: {
        startedAt: 150,
        addedTime: 0,
        current: 0,
      },
      _timer: {
        pausedAt: null,
      },
      rundown: {
        actualStart: 150,
        plannedStart: 100,
      },
    } as RuntimeState;

    const { absolute } = getRuntimeOffset(state);
    expect(absolute).toBe(50);
  });

  it('added time subtracts time offset (positive offset)', () => {
    const state = {
      eventNow: {
        id: '1',
        timeStart: 100,
      },
      timer: {
        startedAt: 150, // we started 50ms delayed
        addedTime: 10, // we compensated with 10ms
        current: 10, // we are 10ms into the timer
      },
      _timer: {
        pausedAt: null,
      },
      rundown: {
        actualStart: 150,
        plannedStart: 100,
      },
    } as RuntimeState;

    const { absolute } = getRuntimeOffset(state);
    expect(absolute).toBe(60);
  });

  it('considers running overtime (negative offset)', () => {
    const state = {
      eventNow: {
        id: '1',
        timeStart: 100,
        timeEnd: 140,
      },
      timer: {
        startedAt: 100, // we started ontime
        current: -10, // we are 10 seconds over
        addedTime: 0, // we have not compensated with added time
      },
      _timer: {
        pausedAt: null,
      },
      rundown: {
        actualStart: 100,
        plannedStart: 100,
      },
    } as RuntimeState;

    const { absolute } = getRuntimeOffset(state);
    expect(absolute).toBe(10);
  });

  it('paused time is delayed time (negative offset)', () => {
    const state = {
      eventNow: {
        id: '1',
        timeStart: 100,
        timeEnd: 150,
      },
      clock: 150,
      timer: {
        startedAt: 100, // started on time
        current: 25, // are 25ms into it
        addedTime: 0,
      },
      _timer: {
        pausedAt: 125, // we have been paused for 25ms (see clock)
      },
      rundown: {
        actualStart: 100,
        plannedStart: 100,
      },
    } as RuntimeState;

    const { absolute } = getRuntimeOffset(state);
    expect(absolute).toBe(25);
  });

  it('offset doesnt exist if we havent started', () => {
    const state = {
      clock: 78480789,
      eventNow: {
        id: 'd6a2ce',
        timeStart: 77400000,
        timeEnd: 81000000,
        duration: 3600000,
        timeStrategy: 'lock-duration',
        linkStart: false,
      },
      rundown: {
        selectedEventIndex: 0,
        numEvents: 2,
        plannedStart: 77400000,
        plannedEnd: 84600000,
        actualStart: null,
      },
      offset: {
        absolute: -77400000,
        expectedRundownEnd: null,
      },
      timer: {
        addedTime: 0,
        current: 3600000,
        duration: 3600000,
        elapsed: null,
        expectedFinish: null,
        playback: 'armed',
        secondaryTimer: null,
        startedAt: null,
      },
      _timer: { pausedAt: null },
    } as RuntimeState;

    const { absolute } = getRuntimeOffset(state);
    expect(absolute).toBe(0);
  });

  it('with time-to-end, offsets dont exist if we are not in overtime', () => {
    const state = {
      clock: 80000000, // 22:13:20
      eventNow: {
        id: 'd6a2ce',
        type: 'event',
        title: '',
        timeStart: 77400000, // 21:30:00
        timeEnd: 81000000, // 22:30:00
        duration: 3600000, // 01:00:00
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: false,
        endAction: EndAction.None,
        timerType: TimerType.CountDown,
        countToEnd: true,
        skip: false,
        note: '',
        colour: '',
        cue: '1',
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        custom: {},
        delay: 0,
      },
      rundown: {
        selectedEventIndex: 0,
        numEvents: 1,
        plannedStart: 77400000, // 21:30:00
        plannedEnd: 81000000, // 22:30:00
        actualStart: 78000000, // 21:40:00
      },
      offset: {
        absolute: 0,
        expectedRundownEnd: 81600000, // 22:40:00
      },
      timer: {
        addedTime: 0,
        current: 1600000,
        duration: 3600000,
        elapsed: 2000000,
        expectedFinish: 81600000,
        playback: Playback.Play,
        secondaryTimer: null,
        startedAt: 78000000,
      },
      _timer: { pausedAt: null },
    } as RuntimeState;

    const { absolute } = getRuntimeOffset(state);
    expect(absolute).toBe(0);
  });

  it('with time-to-end, offset is the overtime', () => {
    const state = {
      clock: 82000000, // 22:46:40
      eventNow: {
        id: 'd6a2ce',
        type: 'event',
        title: '',
        timeStart: 77400000, // 21:30:00
        timeEnd: 81000000, // 22:30:00
        duration: 3600000, // 01:00:00
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: false,
        endAction: EndAction.None,
        timerType: TimerType.CountDown,
        countToEnd: true,
        skip: false,
        note: '',
        colour: '',
        cue: '1',
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        custom: {},
        delay: 0,
      },
      rundown: {
        selectedEventIndex: 0,
        numEvents: 1,
        plannedStart: 77400000, // 21:30:00
        plannedEnd: 81000000, // 22:30:00
        actualStart: 78000000, // 21:40:00
      },
      offset: {
        absolute: 0,
        expectedRundownEnd: 81600000, // 22:40:00
      },
      timer: {
        addedTime: -200000,
        current: -400000,
        duration: 3600000,
        elapsed: 4000000,
        expectedFinish: 81600000,
        playback: Playback.Play,
        secondaryTimer: null,
        startedAt: 78000000,
      },
      _timer: { pausedAt: null },
    } as RuntimeState;

    const { absolute } = getRuntimeOffset(state);
    expect(absolute).toBe(400000); // <--- offset is always the overtime
  });

  it('handles time-to-end started after the end time', () => {
    const state = {
      clock: 82000000, // 22:46:40 <--- starting 16m 40s after the scheduled end
      eventNow: {
        id: 'd6a2ce',
        timeStart: 77400000, // 21:30:00
        timeEnd: 81000000, // 22:30:00
        duration: 3600000, // 01:00:00
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: false,
        endAction: EndAction.None,
        timerType: TimerType.CountDown,
        countToEnd: true,
      },
      rundown: {
        selectedEventIndex: 0,
        numEvents: 1,
        plannedStart: 77400000, // 21:30:00
        plannedEnd: 81000000, // 22:30:00
        actualStart: 82000000, // 22:46:40 <--- started now
      },
      offset: {
        absolute: 0,
        expectedRundownEnd: 82000000 + 3600000, // <--- now + duration
      },
      timer: {
        addedTime: 0,
        current: 0,
        duration: 3600000,
        elapsed: 0,
        expectedFinish: 82000000 + 3600000, // <--- now + duration
        playback: Playback.Play,
        secondaryTimer: null,
        startedAt: 82000000, // <--- started now
      },
      _timer: { pausedAt: null },
    } as RuntimeState;

    const updateCurrent = getCurrent(state);
    state.timer.current = updateCurrent;
    const { absolute } = getRuntimeOffset(state);
    expect(millisToString(absolute)).toBe('00:16:40');
    expect(absolute).toBe(82000000 - 81000000); // <-- now - planned end
  });
});

describe('getRuntimeOffset() relative', () => {
  it('relative offset is 0 when starting at the planed time', () => {
    const state = {
      eventNow: {
        id: '1',
        timeStart: 150,
      },
      timer: {
        startedAt: 150,
        addedTime: 0,
        current: 0,
      },
      _timer: {
        pausedAt: null,
      },
      rundown: {
        actualStart: 150,
        plannedStart: 150,
      },
    } as RuntimeState;

    const { absolute, relative } = getRuntimeOffset(state);
    expect(absolute).toBe(0);
    expect(relative).toBe(0);
  });
  it('relative offset is 0 when starting after the planed time', () => {
    const state = {
      eventNow: {
        id: '1',
        timeStart: 100,
      },
      timer: {
        startedAt: 150,
        addedTime: 0,
        current: 0,
      },
      _timer: {
        pausedAt: null,
      },
      rundown: {
        actualStart: 150,
        plannedStart: 100,
      },
    } as RuntimeState;

    const { absolute, relative } = getRuntimeOffset(state);
    expect(absolute).toBe(50);
    expect(relative).toBe(0);
  });
  it('relative offset is 0 when starting before the planed time', () => {
    const state = {
      eventNow: {
        id: '1',
        timeStart: 150,
      },
      timer: {
        startedAt: 100,
        addedTime: 0,
        current: 0,
      },
      _timer: {
        pausedAt: null,
      },
      rundown: {
        actualStart: 100,
        plannedStart: 150,
      },
    } as RuntimeState;

    const { absolute, relative } = getRuntimeOffset(state);
    expect(absolute).toBe(-50);
    expect(relative).toBe(0);
  });
});

describe('getTimerPhase()', () => {
  it('should be None if the timer is not running', () => {
    const state = {
      timer: {
        addedTime: 0,
        current: null,
        duration: null,
        elapsed: null,
        expectedFinish: null,
        playback: Playback.Stop,
        phase: TimerPhase.None,
        secondaryTimer: null,
        startedAt: null,
      },
    } as RuntimeState;

    const phase = getTimerPhase(state);
    expect(phase).toBe(TimerPhase.None);
  });

  it('can be in overtime', () => {
    const state = {
      timer: {
        addedTime: 0,
        current: -50,
        duration: 1000,
        playback: Playback.Play,
      },
      eventNow: {
        timeDanger: 100,
        timeWarning: 200,
      },
    } as RuntimeState;

    const phase = getTimerPhase(state);
    expect(phase).toBe(TimerPhase.Overtime);
  });

  it('can be danger', () => {
    const state = {
      timer: {
        addedTime: 0,
        current: 0,
        duration: 1000,
        playback: Playback.Play,
      },
      eventNow: {
        timeDanger: 100,
        timeWarning: 200,
      },
    } as RuntimeState;

    const phase = getTimerPhase(state);
    expect(phase).toBe(TimerPhase.Danger);
  });

  it('can be warning', () => {
    const state = {
      timer: {
        addedTime: 0,
        current: 150,
        duration: 1000,
        playback: Playback.Play,
      },
      eventNow: {
        timeDanger: 100,
        timeWarning: 200,
      },
    } as RuntimeState;

    const phase = getTimerPhase(state);
    expect(phase).toBe(TimerPhase.Warning);
  });

  it('it default if the timer is playing and there is none of the above', () => {
    const state = {
      timer: {
        addedTime: 0,
        current: 250,
        duration: 1000,
        playback: Playback.Play,
      },
      eventNow: {
        timeDanger: 100,
        timeWarning: 200,
      },
    } as RuntimeState;

    const phase = getTimerPhase(state);
    expect(phase).toBe(TimerPhase.Default);
  });

  it('#1042 identifies waiting to roll', () => {
    const state = {
      clock: 55691050,
      eventNow: null,
      eventNext: null,
      rundown: {
        selectedEventIndex: null,
        numEvents: 1,
        plannedStart: 55860000,
        plannedEnd: 55880000,
        actualStart: null,
      },
      offset: {
        absolute: 0,
        expectedRundownEnd: null,
      },
      timer: {
        addedTime: 0,
        current: null,
        duration: null,
        elapsed: 0,
        expectedFinish: null,
        phase: 'none',
        playback: 'roll',
        secondaryTimer: 168950,
        startedAt: null,
      },
      _timer: {
        forceFinish: null,
        pausedAt: null,
      },
      _rundown: {
        totalDelay: 0,
      },
    } as RuntimeState;

    const phase = getTimerPhase(state);
    expect(phase).toBe(TimerPhase.Pending);
  });

  it('#1042 identifies waiting to roll', () => {
    const state = {
      clock: 55691050,
      eventNow: null,
      eventNext: null,
      rundown: {
        selectedEventIndex: null,
        numEvents: 1,
        plannedStart: 55860000,
        plannedEnd: 55880000,
        actualStart: null,
      },
      offset: {
        absolute: 0,
        expectedRundownEnd: null,
      },
      timer: {
        addedTime: 0,
        current: null,
        duration: null,
        elapsed: 0,
        expectedFinish: null,
        phase: 'none',
        playback: 'roll',
        secondaryTimer: 168950,
        startedAt: null,
      },
      _timer: {
        forceFinish: null,
        pausedAt: null,
      },
      _rundown: {
        totalDelay: 0,
      },
    } as RuntimeState;

    const phase = getTimerPhase(state);
    expect(phase).toBe(TimerPhase.Pending);
  });
});
