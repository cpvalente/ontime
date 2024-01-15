import { dayInMs } from 'ontime-utils';
import { TimerType } from 'ontime-types';

import { getCurrent, getExpectedFinish, skippedOutOfEvent } from '../timerUtils.js';
import { TState } from '../../state.js';

describe('getExpectedFinish()', () => {
  it('is null if we havent started', () => {
    const state = {
      eventNow: {
        timeEnd: 10,
      },
      timer: {
        addedTime: 0,
        duration: 10,
        finishedAt: null,
        startedAt: null,
        timerType: TimerType.CountDown,
      },
    } as TState;
    const calculatedFinish = getExpectedFinish(state);
    expect(calculatedFinish).toBe(null);
  });
  it('is finishedAt if defined', () => {
    const state = {
      eventNow: {
        timeEnd: 20,
      },
      timer: {
        addedTime: 0,
        duration: 10,
        finishedAt: 20, // <---- finished at
        startedAt: 10,
        timerType: TimerType.CountDown,
      },
    } as TState;
    const calculatedFinish = getExpectedFinish(state);
    expect(calculatedFinish).toBe(20);
  });
  it('calculates the finish time', () => {
    const state = {
      eventNow: {
        timeEnd: 11,
      },
      timer: {
        addedTime: 0,
        duration: 10,
        finishedAt: null,
        startedAt: 1,
        timerType: TimerType.CountDown,
      },
    } as TState;
    const calculatedFinish = getExpectedFinish(state);
    expect(calculatedFinish).toBe(11);
  });
  it('adds paused and added times', () => {
    const state = {
      eventNow: {
        timeEnd: 11,
      },
      timer: {
        addedTime: 20,
        duration: 10,
        finishedAt: null,
        startedAt: 1,
        timerType: TimerType.CountDown,
      },
    } as TState;

    const calculatedFinish = getExpectedFinish(state);
    expect(calculatedFinish).toBe(31);
  });
  it('added time could be negative', () => {
    const state = {
      eventNow: {
        timeEnd: 11,
      },
      timer: {
        addedTime: -10,
        duration: 10,
        finishedAt: null,
        startedAt: 1,
        timerType: TimerType.CountDown,
      },
    } as TState;

    const calculatedFinish = getExpectedFinish(state);
    expect(calculatedFinish).toBe(1);
  });
  it('user could add enough time for it to be negative', () => {
    const state = {
      eventNow: {
        timeEnd: 11,
      },
      timer: {
        addedTime: -100,
        duration: 10,
        finishedAt: null,
        startedAt: 1,
        timerType: TimerType.CountDown,
      },
    } as TState;

    const calculatedFinish = getExpectedFinish(state);
    expect(calculatedFinish).toBe(1);
  });
  it('timer can have no duration', () => {
    const state = {
      eventNow: {
        timeEnd: 0,
      },
      timer: {
        addedTime: 0,
        duration: 0,
        finishedAt: null,
        startedAt: 1,
        timerType: TimerType.CountDown,
      },
    } as TState;

    const calculatedFinish = getExpectedFinish(state);
    expect(calculatedFinish).toBe(1);
  });
  it('finish can be the day after', () => {
    const state = {
      eventNow: {
        timeEnd: 10,
      },
      timer: {
        addedTime: 0,
        duration: dayInMs,
        finishedAt: null,
        startedAt: 10,
        timerType: TimerType.CountDown,
      },
    } as TState;

    const calculatedFinish = getExpectedFinish(state);
    expect(calculatedFinish).toBe(10);
  });
  describe('on timers of type time-to-end', () => {
    it('finish time is as schedule + added time', () => {
      const state = {
        eventNow: {
          timeEnd: 30,
        },
        timer: {
          addedTime: 10,
          duration: dayInMs,
          finishedAt: null,
          startedAt: 10,
          timerType: TimerType.TimeToEnd,
        },
      } as TState;

      const calculatedFinish = getExpectedFinish(state);
      expect(calculatedFinish).toBe(40);
    });
    it('handles events that finish the day after', () => {
      const state = {
        eventNow: {
          timeEnd: 600000, // 00:10:00
        },
        timer: {
          addedTime: 0,
          finishedAt: null,
          startedAt: 79200000, // 22:00:00
          timerType: TimerType.TimeToEnd,
        },
      } as TState;

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
      },
      timer: {
        addedTime: 10,
        clock: 0,
        duration: 111, // <-- we take the duration value
        startedAt: null,
        finishedAt: null,
        timerType: TimerType.CountDown,
      },
    } as TState;

    const current = getCurrent(state);
    expect(current).toBe(111);
  });
  it('is the remaining time in clock', () => {
    const state = {
      eventNow: {
        timeEnd: 10,
      },
      timer: {
        addedTime: 0,
        clock: 1,
        duration: 10,
        startedAt: 0,
        finishedAt: null,
        timerType: TimerType.CountDown,
      },
    } as TState;

    const current = getCurrent(state);
    expect(current).toBe(9);
  });
  it('accounts for added times', () => {
    const state = {
      eventNow: {
        timeEnd: 10,
      },
      timer: {
        addedTime: 10,
        clock: 1,
        duration: 10,
        startedAt: 0,
        finishedAt: null,
        timerType: TimerType.CountDown,
      },
    } as TState;

    const current = getCurrent(state);
    expect(current).toBe(19);
  });
  it('counts over midnight', () => {
    const state = {
      eventNow: {
        timeEnd: 20,
      },
      timer: {
        addedTime: 0,
        clock: 10,
        duration: dayInMs + 10,
        startedAt: 10,
        finishedAt: null,
        timerType: TimerType.CountDown,
      },
    } as TState;

    const current = getCurrent(state);
    expect(current).toBe(dayInMs + 10);
  });
  it('rolls over midnight', () => {
    const state = {
      eventNow: {
        timeEnd: 20,
      },
      timer: {
        addedTime: 0,
        clock: 5,
        duration: dayInMs + 10,
        startedAt: 10,
        finishedAt: null,
        timerType: TimerType.CountDown,
      },
    } as TState;

    const current = getCurrent(state);
    expect(current).toBe(15);
  });
  it('midnight holds delays', () => {
    const state = {
      eventNow: {
        timeEnd: 20,
      },
      timer: {
        addedTime: 20,
        clock: 5,
        duration: dayInMs + 10,
        startedAt: 10,
        finishedAt: null,
        timerType: TimerType.CountDown,
      },
    } as TState;

    const current = getCurrent(state);
    expect(current).toBe(35);
  });
  describe('on timers of type time-to-end', () => {
    it('current time is the time to end', () => {
      const state = {
        eventNow: {
          timeEnd: 100,
        },
        timer: {
          addedTime: 0,
          clock: 30,
          duration: 100,
          startedAt: 10,
          finishedAt: null,
          timerType: TimerType.TimeToEnd,
        },
      } as TState;

      const current = getCurrent(state);
      expect(current).toBe(70);
    });
    it('current time is the time to end + added time', () => {
      const state = {
        eventNow: {
          timeEnd: 100,
        },
        timer: {
          addedTime: 7,
          clock: 30,
          duration: 100,
          startedAt: 10,
          finishedAt: null,
          timerType: TimerType.TimeToEnd,
        },
      } as TState;

      const current = getCurrent(state);
      expect(current).toBe(77);
    });
    it('handles events that finish the day after', () => {
      const state = {
        eventNow: {
          timeEnd: 600000, // 00:10:00
        },
        timer: {
          addedTime: 0,
          clock: 79500000, // 22:05:00
          duration: Infinity, // not relevant,
          startedAt: 79200000, // 22:00:00
          finishedAt: null,
          timerType: TimerType.TimeToEnd,
        },
      } as TState;

      const current = getCurrent(state);
      expect(current).toBe(600000 + dayInMs - 79500000);
    });
    it('does not update ', () => {
      const state = {
        eventNow: {
          timeEnd: 600000, // 00:10:00
        },
        timer: {
          addedTime: 0,
          clock: 79500000, // 22:05:00
          duration: Infinity, // not relevant,
          startedAt: 79200000, // 22:00:00
          finishedAt: null,
          timerType: TimerType.TimeToEnd,
        },
      } as TState;

      const current = getCurrent(state);
      expect(current).toBe(600000 + dayInMs - 79500000);
    });
  });
});

describe('getExpectedFinish() and getCurrentTime() combined', () => {
  it('without added times, they combine to be duration', () => {
    const duration = 10;
    const state = {
      eventNow: {
        timeEnd: 10,
      },
      timer: {
        addedTime: 0,
        clock: 0,
        duration,
        startedAt: 0,
        finishedAt: null,
        timerType: TimerType.CountDown,
      },
    } as TState;

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
      },
      timer: {
        addedTime: 3,
        clock: 5,
        duration,
        startedAt: 0,
        finishedAt: null,
        timerType: TimerType.CountDown,
      },
    } as TState;

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
      timer: {
        clock: previousTime,
        expectedFinish,
        startedAt,
      },
    } as TState;

    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);

    // @ts-expect-error -- cheating in tests
    state.timer.clock += testSkipLimit;
    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);
  });

  it('allows rolling backwards in an event', () => {
    const startedAt = 1000;
    const duration = 1000;
    const expectedFinish = startedAt + duration;
    const previousTime = startedAt + testSkipLimit / 2;

    const state = {
      timer: {
        clock: previousTime,
        expectedFinish,
        startedAt,
      },
    } as TState;

    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);

    // @ts-expect-error -- cheating in tests
    state.timer.clock += testSkipLimit;
    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);
  });

  it('accounts for crossing midnight', () => {
    const startedAt = dayInMs - testSkipLimit;
    const expectedFinish = 10;
    const previousTime = dayInMs - 1;

    const state = {
      timer: {
        clock: previousTime,
        expectedFinish,
        startedAt,
      },
    } as TState;

    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);

    // @ts-expect-error -- cheating in tests
    state.timer.clock = testSkipLimit - 2;
    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);
  });

  it('allows rolling backwards in an event across midnight', () => {
    const startedAt = dayInMs - testSkipLimit;
    const expectedFinish = 10;
    const previousTime = startedAt + 1;

    const state = {
      timer: {
        clock: previousTime,
        expectedFinish,
        startedAt,
      },
    } as TState;

    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);

    // @ts-expect-error -- cheating in tests
    state.timer.clock -= testSkipLimit;
    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);
  });

  it('finds skip forwards out of event', () => {
    const startedAt = 1000;
    const duration = 1000;
    const expectedFinish = startedAt + duration;
    const previousTime = expectedFinish - testSkipLimit / 2;

    const state = {
      timer: {
        clock: previousTime,
        expectedFinish,
        startedAt,
      },
    } as TState;

    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);

    // @ts-expect-error -- cheating in tests
    state.timer.clock += testSkipLimit + 1;
    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(true);
  });

  it('finds skip backwards out of event', () => {
    const startedAt = 1000;
    const duration = 1000;
    const expectedFinish = startedAt + duration;
    const previousTime = startedAt + testSkipLimit / 2;

    const state = {
      timer: {
        clock: previousTime,
        expectedFinish,
        startedAt,
      },
    } as TState;

    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);

    // @ts-expect-error -- cheating in tests
    state.timer.clock -= testSkipLimit + 1;
    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(true);
  });

  it('finds skip forwards out of event across midnight', () => {
    const startedAt = dayInMs - testSkipLimit;
    const expectedFinish = 10;
    const previousTime = dayInMs - 3;

    const state = {
      timer: {
        clock: previousTime,
        expectedFinish,
        startedAt,
      },
    } as TState;

    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);

    // @ts-expect-error -- cheating in tests
    state.timer.clock = testSkipLimit - 2;
    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(true);
  });

  it('finds skip backwards out of event across midnight', () => {
    const startedAt = dayInMs - testSkipLimit;
    const expectedFinish = 10;
    const previousTime = startedAt + 1;

    const state = {
      timer: {
        clock: previousTime,
        expectedFinish,
        startedAt,
      },
    } as TState;

    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(false);

    // @ts-expect-error -- cheating in tests
    state.timer.clock -= testSkipLimit + 1;
    expect(skippedOutOfEvent(state, previousTime, testSkipLimit)).toBe(true);
  });
});
