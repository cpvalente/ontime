import { dayInMs } from 'ontime-utils';
import { OntimeEvent, TimerType } from 'ontime-types';

import {
  getCurrent,
  getExpectedFinish,
  getRollTimers,
  normaliseEndTime,
  skippedOutOfEvent,
  updateRoll,
} from '../timerUtils.js';
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
        pausedAt: null,
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
        pausedAt: null,
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
        pausedAt: null,
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
        pausedAt: null,
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
        pausedAt: null,
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
        pausedAt: null,
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
        pausedAt: null,
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
        pausedAt: null,
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
          pausedAt: null,
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
          pausedAt: null,
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
        pausedAt: null,
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
        pausedAt: null,
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
        pausedAt: null,
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
        pausedAt: null,
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
        pausedAt: null,
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
          pausedAt: null,
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
          pausedAt: null,
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
          pausedAt: null,
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
          pausedAt: null,
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
        pausedAt: null,
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
        pausedAt: null,
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

describe('getRollTimers()', () => {
  const eventlist: Partial<OntimeEvent>[] = [
    {
      id: '1',
      timeStart: 5,
      timeEnd: 10,
      isPublic: false,
    },
    {
      id: '2',
      timeStart: 10,
      timeEnd: 20,
      isPublic: false,
    },
    {
      id: '3',
      timeStart: 20,
      timeEnd: 30,
      isPublic: false,
    },
    {
      id: '4',
      timeStart: 30,
      timeEnd: 40,
      isPublic: false,
    },
    {
      id: '5',
      timeStart: 40,
      timeEnd: 50,
      isPublic: true,
    },
    {
      id: '6',
      timeStart: 50,
      timeEnd: 60,
      isPublic: false,
    },
    {
      id: '7',
      timeStart: 60,
      timeEnd: 70,
      isPublic: true,
    },
    {
      id: '8',
      timeStart: 70,
      timeEnd: 80,
      isPublic: false,
    },
  ];

  it('if timer is at 0', () => {
    const now = 0;
    const expected = {
      nowIndex: null,
      nowId: null,
      publicIndex: null,
      nextIndex: 0,
      publicNextIndex: 4,
      timeToNext: 5,
      nextEvent: eventlist[0],
      nextPublicEvent: eventlist[4],
      currentEvent: null,
      currentPublicEvent: null,
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 5', () => {
    const now = 5;
    const expected = {
      nowIndex: 0,
      nowId: eventlist[0].id,
      publicIndex: null,
      nextIndex: 1,
      publicNextIndex: 4,
      timeToNext: 5,
      nextEvent: eventlist[1],
      nextPublicEvent: eventlist[4],
      currentEvent: eventlist[0],
      currentPublicEvent: null,
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 15', () => {
    const now = 15;
    const expected = {
      nowIndex: 1,
      nowId: eventlist[1].id,
      publicIndex: null,
      nextIndex: 2,
      publicNextIndex: 4,
      timeToNext: 5,
      nextEvent: eventlist[2],
      nextPublicEvent: eventlist[4],
      currentEvent: eventlist[1],
      currentPublicEvent: null,
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 20', () => {
    const now = 20;
    const expected = {
      nowIndex: 2,
      nowId: eventlist[2].id,
      publicIndex: null,
      nextIndex: 3,
      publicNextIndex: 4,
      timeToNext: 10,
      nextEvent: eventlist[3],
      nextPublicEvent: eventlist[4],
      currentEvent: eventlist[2],
      currentPublicEvent: null,
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 49', () => {
    const now = 49;
    const expected = {
      nowIndex: 4,
      nowId: eventlist[4].id,
      publicIndex: 4,
      nextIndex: 5,
      publicNextIndex: 6,
      timeToNext: 1,
      nextEvent: eventlist[5],
      nextPublicEvent: eventlist[6],
      currentEvent: eventlist[4],
      currentPublicEvent: eventlist[4],
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 63', () => {
    const now = 63;
    const expected = {
      nowIndex: 6,
      nowId: eventlist[6].id,
      publicIndex: 6,
      nextIndex: 7,
      publicNextIndex: null,
      timeToNext: 7,
      nextEvent: eventlist[7],
      nextPublicEvent: null,
      currentEvent: eventlist[6],
      currentPublicEvent: eventlist[6],
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 75', () => {
    const now = 75;
    const expected = {
      nowIndex: 7,
      nowId: eventlist[7].id,
      publicIndex: 6,
      nextIndex: null,
      publicNextIndex: null,
      timeToNext: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: eventlist[7],
      currentPublicEvent: eventlist[6],
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 100 we roll to day after', () => {
    const now = 100;
    const expected = {
      nowIndex: null,
      nowId: null,
      publicIndex: null,
      nextIndex: 0,
      publicNextIndex: 4,
      timeToNext: dayInMs - now + eventlist[0].timeStart,
      nextEvent: eventlist[0],
      nextPublicEvent: eventlist[4],
      currentEvent: null,
      currentPublicEvent: null,
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('handles rolls to next day with real values', () => {
    const singleEventList: Partial<OntimeEvent>[] = [
      {
        id: '1',
        timeStart: 36000000, // 10:00
        timeEnd: 39600000, // 11:00
        isPublic: true,
      },
    ];
    const now = 64800000; // 18:00
    const expected = {
      nowIndex: null,
      nowId: null,
      publicIndex: null,
      nextIndex: 0,
      publicNextIndex: 0,
      timeToNext: dayInMs - now + singleEventList[0].timeStart,
      nextEvent: singleEventList[0],
      nextPublicEvent: singleEventList[0],
      currentEvent: null,
      currentPublicEvent: null,
    };
    const state = getRollTimers(singleEventList as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('handles rolls to next day with real values', () => {
    const singleEventList: Partial<OntimeEvent>[] = [
      {
        id: '1',
        timeStart: 36000000, // 10:00
        timeEnd: 3600000, // 01:00
        isPublic: true,
      },
    ];
    const now = 60000; // 00:01
    const expected = {
      nowIndex: 0,
      nowId: singleEventList[0].id,
      publicIndex: 0,
      nextIndex: null,
      publicNextIndex: null,
      timeToNext: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: singleEventList[0],
      currentPublicEvent: singleEventList[0],
    };
    const state = getRollTimers(singleEventList as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });
  it('handles rolls to next day with real values', () => {
    const singleEventList: Partial<OntimeEvent>[] = [
      {
        id: '1',
        timeStart: 36000000, // 10:00
        timeEnd: 3600000, // 01:00
        isPublic: true,
      },
    ];
    const now = 60000; // 00:01
    const expected = {
      nowIndex: 0,
      nowId: singleEventList[0].id,
      publicIndex: 0,
      nextIndex: null,
      publicNextIndex: null,
      timeToNext: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: singleEventList[0],
      currentPublicEvent: singleEventList[0],
    };
    const state = getRollTimers(singleEventList as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('handles roll that goes over midnight', () => {
    const singleEventList: Partial<OntimeEvent>[] = [
      {
        id: '1',
        timeStart: 72000000, // 20:00
        timeEnd: 60000, // 00:10
        isPublic: true,
      },
    ];
    const now = 6000; // 00:01
    const expected = {
      nowIndex: 0,
      nowId: singleEventList[0].id,
      publicIndex: 0,
      nextIndex: null,
      publicNextIndex: null,
      timeToNext: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: singleEventList[0],
      currentPublicEvent: singleEventList[0],
    };
    const state = getRollTimers(singleEventList as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });
});

describe('getRollTimers() test that roll behaviour with overlapping times', () => {
  const eventlist: Partial<OntimeEvent>[] = [
    {
      id: '1',
      timeStart: 10,
      timeEnd: 10,
      isPublic: false,
    },
    {
      id: '2',
      timeStart: 10,
      timeEnd: 20,
      isPublic: true,
    },
    {
      id: '3',
      timeStart: 10,
      timeEnd: 30,
      isPublic: false,
    },
  ];

  it('if timer is at 0', () => {
    const now = 0;
    const expected = {
      nowIndex: null,
      nowId: null,
      publicIndex: null,
      nextIndex: 0,
      publicNextIndex: 1,
      timeToNext: 10,
      nextEvent: eventlist[0],
      nextPublicEvent: eventlist[1],
      currentEvent: null,
      currentPublicEvent: null,
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 10', () => {
    const now = 10;
    const expected = {
      nowIndex: 1,
      nowId: eventlist[1].id,
      publicIndex: 1,
      nextIndex: 2,
      publicNextIndex: null,
      timeToNext: 0,
      nextEvent: eventlist[2],
      nextPublicEvent: null,
      currentEvent: eventlist[1],
      currentPublicEvent: eventlist[1],
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 15', () => {
    const now = 15;
    const expected = {
      nowIndex: 1,
      nowId: eventlist[1].id,
      publicIndex: 1,
      nextIndex: 2,
      publicNextIndex: null,
      timeToNext: -5,
      nextEvent: eventlist[2],
      nextPublicEvent: null,
      currentEvent: eventlist[1],
      currentPublicEvent: eventlist[1],
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 20', () => {
    const now = 20;
    const expected = {
      nowIndex: 2,
      nowId: eventlist[2].id,
      publicIndex: 1,
      nextIndex: null,
      publicNextIndex: null,
      timeToNext: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: eventlist[2],
      currentPublicEvent: eventlist[1],
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 25', () => {
    const now = 25;
    const expected = {
      nowIndex: 2,
      nowId: eventlist[2].id,
      publicIndex: 1,
      nextIndex: null,
      publicNextIndex: null,
      timeToNext: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: eventlist[2],
      currentPublicEvent: eventlist[1],
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });
});

// issue #58
describe('getRollTimers() test that roll behaviour multi day event edge cases', () => {
  it('if the start time is the day after end time, and start time is earlier than now', () => {
    const now = 66600000; // 19:30
    const eventlist: Partial<OntimeEvent>[] = [
      {
        id: '1',
        timeStart: 66000000, // 19:20
        timeEnd: 54600000, // 16:10
        isPublic: false,
      },
    ];
    const expected = {
      nowIndex: 0,
      nowId: '1',
      publicIndex: null,
      nextIndex: null,
      publicNextIndex: null,
      timeToNext: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: eventlist[0],
      currentPublicEvent: null,
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if the start time is the day after end time, and both are later than now', () => {
    const now = 66840000; // 19:34
    const eventlist: Partial<OntimeEvent>[] = [
      {
        id: '1',
        timeStart: 67200000, // 19:40
        timeEnd: 66900000, // 19:35
        isPublic: false,
      },
    ];
    const expected = {
      currentEvent: {
        id: '1',
        isPublic: false,
        timeEnd: 66900000,
        timeStart: 67200000,
      },
      currentPublicEvent: null,
      nextEvent: null,
      nextIndex: null,
      nextPublicEvent: null,
      nowId: '1',
      nowIndex: 0,
      publicIndex: null,
      publicNextIndex: null,
      timeToNext: null,
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
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

describe('updateRoll()', () => {
  it('it updates running events correctly', () => {
    const timers = {
      runtime: {
        selectedEventId: '1',
      },
      timer: {
        current: 10,
        expectedFinish: 15,
        clock: 11,
        secondaryTimer: null,
        secondaryTarget: null,
      },
    } as TState;

    const expected = {
      updatedTimer: 15 - 11,
      updatedSecondaryTimer: null, // usually clock - expectedFinish
      doRollLoad: false,
      isFinished: false,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);

    // test that it can jump time
    // @ts-expect-error -- cheating for tests
    timers.timer.expectedFinish = 1000;
    // @ts-expect-error -- cheating for tests
    timers.timer.clock = 600;
    expected.updatedTimer = 1000 - 600;

    expect(updateRoll(timers)).toStrictEqual(expected);
  });

  it('it updates secondary timer', () => {
    const timers = {
      runtime: {
        selectedEventId: null,
      },
      timer: {
        current: null,
        expectedFinish: null,
        clock: 11,
        secondaryTimer: 1,
        secondaryTarget: 15,
      },
    } as TState;

    const expected = {
      updatedTimer: null,
      updatedSecondaryTimer: 15 - 11, // countdown to secondary
      doRollLoad: false,
      isFinished: false,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);
  });

  it('flags an event end', () => {
    const timers = {
      runtime: {
        selectedEventId: '1',
      },
      timer: {
        startedAt: 0,
        current: 10,
        expectedFinish: 11,
        clock: 12,
        secondaryTimer: null,
        secondaryTarget: null,
      },
    } as TState;

    const expected = {
      updatedTimer: -1,
      updatedSecondaryTimer: null,
      doRollLoad: true,
      isFinished: true,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);
  });

  it('secondary events do not trigger event ends', () => {
    const timers = {
      runtime: {
        selectedEventId: null,
      },
      timer: {
        startedAt: null,
        current: null,
        expectedFinish: null,
        clock: 16,
        secondaryTimer: 1,
        secondaryTarget: 15,
      },
    } as TState;

    const expected = {
      updatedTimer: null,
      updatedSecondaryTimer: -1,
      doRollLoad: true,
      isFinished: false,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);
  });

  it('when a secondary timer is finished, it prompts for new event load', () => {
    const timers = {
      runtime: {
        selectedEventId: null,
      },
      timer: {
        current: null,
        expectedFinish: null,
        clock: 15,
        secondaryTimer: 0,
        secondaryTarget: 15,
      },
    } as TState;

    const expected = {
      updatedTimer: null,
      updatedSecondaryTimer: 0,
      doRollLoad: true,
      isFinished: false,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);
  });

  it('counts over midnight', () => {
    const timers = {
      runtime: {
        selectedEventId: '1',
      },
      timer: {
        current: 25,
        expectedFinish: 10,
        startedAt: 1000,
        clock: dayInMs - 10,
        secondaryTimer: null,
        secondaryTarget: null,
      },
    } as TState;

    const expected = {
      updatedTimer: 20,
      updatedSecondaryTimer: null,
      doRollLoad: false,
      isFinished: false,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);
  });

  it('rolls over midnight', () => {
    const timers = {
      runtime: {
        selectedEventId: '1',
      },
      timer: {
        current: dayInMs,
        expectedFinish: 10,
        startedAt: 1000,
        clock: 10,
        secondaryTimer: null,
        secondaryTarget: null,
      },
    } as TState;

    const expected = {
      updatedTimer: dayInMs,
      updatedSecondaryTimer: null,
      doRollLoad: false,
      isFinished: false,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);
  });
});
