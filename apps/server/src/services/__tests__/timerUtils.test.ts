import { dayInMs, millisToString } from 'ontime-utils';
import { EndAction, OntimeEvent, Playback, TimeStrategy, TimerType } from 'ontime-types';

import {
  getCurrent,
  getExpectedFinish,
  getRollTimers,
  getRuntimeOffset,
  normaliseEndTime,
  skippedOutOfEvent,
  updateRoll,
} from '../timerUtils.js';
import { RuntimeState } from '../../stores/runtimeState.js';

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
        finishedAt: null,
        startedAt: null,
      },
      _timer: {
        pausedAt: null,
      },
    } as RuntimeState;
    const calculatedFinish = getExpectedFinish(state);
    expect(calculatedFinish).toBe(null);
  });
  it('is finishedAt if defined', () => {
    const state = {
      eventNow: {
        timeEnd: 20,
        timerType: TimerType.CountDown,
      },
      timer: {
        addedTime: 0,
        duration: 10,
        finishedAt: 20, // <---- finished at
        startedAt: 10,
      },
      _timer: {
        pausedAt: null,
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
        finishedAt: null,
        startedAt: 1,
      },
      _timer: {
        pausedAt: null,
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
        finishedAt: null,
        startedAt: 1,
      },
      _timer: {
        pausedAt: null,
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
        finishedAt: null,
        startedAt: 1,
      },
      _timer: {
        pausedAt: null,
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
        finishedAt: null,
        startedAt: 1,
      },
      _timer: {
        pausedAt: null,
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
        finishedAt: null,
        startedAt: 1,
      },
      _timer: {
        pausedAt: null,
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
        finishedAt: null,
        startedAt: 10,
      },
      _timer: {
        pausedAt: null,
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
          timerType: TimerType.TimeToEnd,
        },
        timer: {
          addedTime: 10,
          duration: dayInMs,
          finishedAt: null,
          startedAt: 10,
        },
        _timer: {
          pausedAt: null,
        },
      } as RuntimeState;

      const calculatedFinish = getExpectedFinish(state);
      expect(calculatedFinish).toBe(40);
    });
    it('handles events that finish the day after', () => {
      const state = {
        eventNow: {
          timeEnd: 600000, // 00:10:00
          timerType: TimerType.TimeToEnd,
        },
        timer: {
          addedTime: 0,
          finishedAt: null,
          startedAt: 79200000, // 22:00:00
        },
        _timer: {
          pausedAt: null,
        },
        runtime: {
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
        finishedAt: null,
      },
      _timer: {
        pausedAt: null,
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
        finishedAt: null,
      },
      _timer: {
        pausedAt: null,
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
        finishedAt: null,
      },
      _timer: {
        pausedAt: null,
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
        finishedAt: null,
      },
      _timer: {
        pausedAt: null,
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
        finishedAt: null,
      },
      _timer: {
        pausedAt: null,
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
        finishedAt: null,
      },
      _timer: {
        pausedAt: null,
      },
    } as RuntimeState;

    const current = getCurrent(state);
    expect(current).toBe(35);
  });

  describe('on timers of type time-to-end', () => {
    it('current time is the time to end even if it hasnt started, this is weird, but by design', () => {
      const state = {
        eventNow: {
          timeEnd: 100,
          timerType: TimerType.TimeToEnd,
        },
        clock: 30,
        timer: {
          addedTime: 0,
          duration: 100,
          startedAt: null,
          finishedAt: null,
        },
        runtime: {
          plannedEnd: null,
        },
        _timer: {
          pausedAt: null,
        },
      } as RuntimeState;

      const current = getCurrent(state);
      expect(current).toBe(70);
    });

    it('current time is the time to end', () => {
      const state = {
        eventNow: {
          timeEnd: 100,
          timerType: TimerType.TimeToEnd,
        },
        clock: 30,
        timer: {
          addedTime: 0,
          duration: 100,
          startedAt: 10,
          finishedAt: null,
        },
        runtime: {
          plannedEnd: 100,
        },
        _timer: {
          pausedAt: null,
        },
      } as RuntimeState;

      const current = getCurrent(state);
      expect(current).toBe(70);
    });

    it('current time is the time to end + added time', () => {
      const state = {
        eventNow: {
          timeEnd: 100,
          timerType: TimerType.TimeToEnd,
        },
        clock: 30,
        timer: {
          addedTime: 7,
          duration: 100,
          startedAt: 10,
          finishedAt: null,
        },
        runtime: {
          plannedEnd: 100,
        },
        _timer: {
          pausedAt: null,
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
          timerType: TimerType.TimeToEnd,
        },
        clock: 79500000, // 22:05:00
        timer: {
          addedTime: 0,
          duration: Infinity, // not relevant,
          startedAt: 79200000, // 22:00:00
          finishedAt: null,
        },
        runtime: {
          actualStart: 79200000,
          plannedEnd: 600000,
        },
        _timer: {
          pausedAt: null,
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
          timerType: TimerType.TimeToEnd,
        },
        timer: {
          addedTime: 0,
          duration: Infinity, // not relevant,
          startedAt: 79200000, // 22:00:00
          finishedAt: null,
        },
        runtime: {
          actualStart: 82000000, // 22:46:40 <--- started now
          plannedEnd: 81000000, // 22:30:00
        },
        _timer: {
          pausedAt: null,
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
        finishedAt: null,
      },
      _timer: {
        pausedAt: null,
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
        finishedAt: null,
      },
      _timer: {
        pausedAt: null,
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
      timeToNext: dayInMs - now + eventlist[0].timeStart!,
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
      timeToNext: dayInMs - now + singleEventList[0].timeStart!,
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
      eventNow: {
        id: '1',
      },
      clock: 11,
      timer: {
        current: 10,
        expectedFinish: 15,
        secondaryTimer: null,
        startedAt: 1,
      },
      _timer: {
        secondaryTarget: null,
      },
    } as RuntimeState;

    const expected = {
      updatedTimer: 15 - 11,
      updatedSecondaryTimer: null, // usually clock - expectedFinish
      doRollLoad: false,
      isFinished: false,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);

    // test that it can jump time
    timers.timer.expectedFinish = 1000;
    timers.clock = 600;
    expected.updatedTimer = 1000 - 600;

    expect(updateRoll(timers)).toStrictEqual(expected);
  });

  it('it updates secondary timer', () => {
    const timers = {
      eventNow: null,
      clock: 11,
      timer: {
        current: null,
        expectedFinish: null,
        secondaryTimer: 1,
      },
      _timer: {
        secondaryTarget: 15,
      },
    } as RuntimeState;

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
      eventNow: {
        id: '1',
      },
      clock: 12,
      timer: {
        startedAt: 0,
        current: 10,
        expectedFinish: 11,
        secondaryTimer: null,
      },
      _timer: {
        secondaryTarget: null,
      },
    } as RuntimeState;

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
      eventNow: null,
      clock: 16,
      timer: {
        startedAt: null,
        current: null,
        expectedFinish: null,
        secondaryTimer: 1,
      },
      _timer: {
        secondaryTarget: 15,
      },
    } as RuntimeState;

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
      eventNow: null,
      clock: 15,
      timer: {
        current: null,
        expectedFinish: null,
        secondaryTimer: 0,
      },
      _timer: {
        secondaryTarget: 15,
      },
    } as RuntimeState;

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
      eventNow: {
        id: '1',
      },
      clock: dayInMs - 10,
      timer: {
        current: 25,
        expectedFinish: 10,
        startedAt: 1000,
        secondaryTimer: null,
      },
      _timer: {
        secondaryTarget: null,
      },
    } as RuntimeState;

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
      eventNow: {
        id: '1',
      },
      clock: 10,
      timer: {
        current: dayInMs,
        expectedFinish: 10,
        startedAt: 1000,
        secondaryTimer: null,
      },
      _timer: {
        secondaryTarget: null,
      },
    } as RuntimeState;

    const expected = {
      updatedTimer: dayInMs,
      updatedSecondaryTimer: null,
      doRollLoad: false,
      isFinished: false,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);
  });
});

describe('getRuntimeOffset()', () => {
  it('calculates the difference between schedule and actual start', () => {
    const state = {
      eventNow: {
        id: '1',
        timeStart: 100,
      },
      timer: {
        startedAt: 150,
        addedTime: 10,
        current: 0,
      },
      _timer: {
        pausedAt: null,
      },
      runtime: {
        actualStart: 150,
      },
    } as RuntimeState;

    const offset = getRuntimeOffset(state);
    expect(offset).toBe(60);
  });

  it('adds the overtime time of the current timer', () => {
    const state = {
      eventNow: {
        id: '1',
        timeStart: 100,
        timeEnd: 140,
      },
      timer: {
        startedAt: 100,
        current: -10,
        addedTime: 0,
      },
      _timer: {
        pausedAt: null,
      },
      runtime: {
        actualStart: 100,
      },
    } as RuntimeState;

    const offset = getRuntimeOffset(state);
    expect(offset).toBe(10);
  });

  it('accounts for paused time', () => {
    const state = {
      eventNow: {
        id: '1',
        timeStart: 100,
        timeEnd: 150,
      },
      clock: 150,
      timer: {
        startedAt: 100,
        current: 25,
        addedTime: 0,
      },
      _timer: {
        pausedAt: 125,
      },
      runtime: {
        actualStart: 100,
      },
    } as RuntimeState;

    const offset = getRuntimeOffset(state);
    expect(offset).toBe(25);
  });

  it('can only count once started', () => {
    const state = {
      clock: 78480789,
      eventNow: {
        id: 'd6a2ce',
        type: 'event',
        title: '',
        timeStart: 77400000,
        timeEnd: 81000000,
        duration: 3600000,
        timeStrategy: 'lock-duration',
        linkStart: null,
        endAction: 'none',
        timerType: 'count-down',
        isPublic: true,
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
      runtime: {
        selectedEventIndex: 0,
        numEvents: 2,
        offset: -77400000,
        plannedStart: 77400000,
        plannedEnd: 84600000,
        actualStart: null,
        expectedEnd: null,
      },
      timer: {
        addedTime: 0,
        current: 3600000,
        duration: 3600000,
        elapsed: null,
        expectedFinish: null,
        finishedAt: null,
        playback: 'armed',
        secondaryTimer: null,
        startedAt: null,
      },
      _timer: { pausedAt: null, secondaryTarget: null },
    } as RuntimeState;

    const offset = getRuntimeOffset(state);
    expect(offset).toBe(null);
  });

  it('handles loaded event', () => {
    const state = {
      clock: 79521653,
      eventNow: {
        id: '835242',
        type: 'event',
        title: '',
        timeStart: 81000000,
        timeEnd: 84600000,
        duration: 3600000,
        timeStrategy: 'lock-duration',
        linkStart: null,
        endAction: 'none',
        timerType: 'count-down',
        isPublic: true,
        skip: false,
        note: '',
        colour: '',
        cue: '2',
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        custom: {},
        delay: 0,
      },
      runtime: {
        selectedEventIndex: 1,
        numEvents: 2,
        offset: -81000000,
        plannedStart: 77400000,
        plannedEnd: 84600000,
        actualStart: 79443403,
        expectedEnd: null,
      },
      timer: {
        addedTime: 0,
        current: 3600000,
        duration: 3600000,
        elapsed: null,
        expectedFinish: null,
        finishedAt: null,
        playback: 'armed',
        secondaryTimer: null,
        startedAt: null,
      },
      _timer: { pausedAt: null, secondaryTarget: null },
    } as RuntimeState;

    const offset = getRuntimeOffset(state);
    expect(offset).toBe(79521653 - 81000000);
  });

  it('handles time-to-end', () => {
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
        linkStart: null,
        endAction: EndAction.None,
        timerType: TimerType.TimeToEnd,
        isPublic: true,
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
      runtime: {
        selectedEventIndex: 0,
        numEvents: 1,
        offset: null,
        plannedStart: 77400000, // 21:30:00
        plannedEnd: 81000000, // 22:30:00
        actualStart: 78000000, // 21:40:00
        expectedEnd: 81600000, // 22:40:00
      },
      timer: {
        addedTime: 0,
        current: 1600000,
        duration: 3600000,
        elapsed: 2000000,
        expectedFinish: 81600000,
        finishedAt: null,
        playback: Playback.Play,
        secondaryTimer: null,
        startedAt: 78000000,
      },
      _timer: { pausedAt: null, secondaryTarget: null },
    } as RuntimeState;

    const offset = getRuntimeOffset(state);
    expect(offset).toBe(0);
  });

  it('handles time-to-end with delays', () => {
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
        linkStart: null,
        endAction: EndAction.None,
        timerType: TimerType.TimeToEnd,
        isPublic: true,
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
      runtime: {
        selectedEventIndex: 0,
        numEvents: 1,
        offset: null,
        plannedStart: 77400000, // 21:30:00
        plannedEnd: 81000000, // 22:30:00
        actualStart: 78000000, // 21:40:00
        expectedEnd: 81600000, // 22:40:00
      },
      timer: {
        addedTime: 0,
        current: -400000,
        duration: 3600000,
        elapsed: 4000000,
        expectedFinish: 81600000,
        finishedAt: null,
        playback: Playback.Play,
        secondaryTimer: null,
        startedAt: 78000000,
      },
      _timer: { pausedAt: null, secondaryTarget: null },
    } as RuntimeState;

    const offset = getRuntimeOffset(state);
    expect(offset).toBe(-400000);
  });

  it('handles time-to-end started after the end time', () => {
    const state = {
      clock: 82000000, // 22:46:40 <--- starting 16 min after the scheduled end
      eventNow: {
        id: 'd6a2ce',
        type: 'event',
        title: '',
        timeStart: 77400000, // 21:30:00
        timeEnd: 81000000, // 22:30:00
        duration: 3600000, // 01:00:00
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: null,
        endAction: EndAction.None,
        timerType: TimerType.TimeToEnd,
        isPublic: true,
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
      runtime: {
        selectedEventIndex: 0,
        numEvents: 1,
        offset: null,
        plannedStart: 77400000, // 21:30:00
        plannedEnd: 81000000, // 22:30:00
        actualStart: 82000000, // 22:46:40 <--- started now
        expectedEnd: 82000000 + 3600000, // <--- now + duration
      },
      timer: {
        addedTime: 0,
        current: 0,
        duration: 3600000,
        elapsed: 0,
        expectedFinish: 82000000 + 3600000, // <--- now + duration
        finishedAt: null,
        playback: Playback.Play,
        secondaryTimer: null,
        startedAt: 82000000, // <--- started now
      },
      _timer: { pausedAt: null, secondaryTarget: null },
    } as RuntimeState;

    const updateCurrent = getCurrent(state);
    state.timer.current = updateCurrent;
    const offset = getRuntimeOffset(state);
    expect(offset).toBe(81000000 - 82000000); // <-- planned end - now
  });
});
