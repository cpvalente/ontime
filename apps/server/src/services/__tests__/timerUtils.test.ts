import { dayInMs } from 'ontime-utils';
import { TimerType } from 'ontime-types';

import { getCurrent, getExpectedFinish, skippedOutOfEvent } from '../timerUtils.js';

describe('getExpectedFinish()', () => {
  it('is null if we havent started', () => {
    const startedAt = null;
    const finishedAt = null;
    const duration = 10;
    const pausedTime = 0;
    const addedTime = 0;
    const endTime = 10;
    const timerType = TimerType.CountDown;
    const calculatedFinish = getExpectedFinish(
      startedAt,
      finishedAt,
      duration,
      pausedTime,
      addedTime,
      endTime,
      timerType,
    );
    expect(calculatedFinish).toBe(null);
  });
  it('is finishedAt if defined', () => {
    const startedAt = 10;
    const finishedAt = 20;
    const duration = 10;
    const pausedTime = 0;
    const addedTime = 0;
    const endTime = 20;
    const timerType = TimerType.CountDown;
    const calculatedFinish = getExpectedFinish(
      startedAt,
      finishedAt,
      duration,
      pausedTime,
      addedTime,
      endTime,
      timerType,
    );
    expect(calculatedFinish).toBe(finishedAt);
  });
  it('calculates the finish time', () => {
    const startedAt = 1;
    const finishedAt = null;
    const duration = 10;
    const pausedTime = 0;
    const addedTime = 0;
    const endTime = 11;
    const timerType = TimerType.CountDown;
    const calculatedFinish = getExpectedFinish(
      startedAt,
      finishedAt,
      duration,
      pausedTime,
      addedTime,
      endTime,
      timerType,
    );
    expect(calculatedFinish).toBe(11);
  });
  it('adds paused and added times', () => {
    const startedAt = 1;
    const finishedAt = null;
    const duration = 10;
    const pausedTime = 10;
    const addedTime = 10;
    const endTime = 11;
    const timerType = TimerType.CountDown;
    const calculatedFinish = getExpectedFinish(
      startedAt,
      finishedAt,
      duration,
      pausedTime,
      addedTime,
      endTime,
      timerType,
    );
    expect(calculatedFinish).toBe(31);
  });
  it('added time could be negative', () => {
    const startedAt = 1;
    const finishedAt = null;
    const duration = 10;
    const pausedTime = 10;
    const addedTime = -10;
    const endTime = 11;
    const timerType = TimerType.CountDown;
    const calculatedFinish = getExpectedFinish(
      startedAt,
      finishedAt,
      duration,
      pausedTime,
      addedTime,
      endTime,
      timerType,
    );
    expect(calculatedFinish).toBe(11);
  });
  it('user could add enough time for it to be negative', () => {
    const startedAt = 1;
    const finishedAt = null;
    const duration = 10;
    const pausedTime = 0;
    const addedTime = -100;
    const endTime = 11;
    const timerType = TimerType.CountDown;
    const calculatedFinish = getExpectedFinish(
      startedAt,
      finishedAt,
      duration,
      pausedTime,
      addedTime,
      endTime,
      timerType,
    );
    expect(calculatedFinish).toBe(1);
  });
  it('timer can have no duration', () => {
    const startedAt = 1;
    const finishedAt = null;
    const duration = 0;
    const pausedTime = 0;
    const addedTime = 0;
    const endTime = 0;
    const timerType = TimerType.CountDown;
    const calculatedFinish = getExpectedFinish(
      startedAt,
      finishedAt,
      duration,
      pausedTime,
      addedTime,
      endTime,
      timerType,
    );
    expect(calculatedFinish).toBe(1);
  });
  it('finish can be the day after', () => {
    const startedAt = 10;
    const finishedAt = null;
    const duration = dayInMs;
    const pausedTime = 0;
    const addedTime = 0;
    const endTime = 10;
    const timerType = TimerType.CountDown;
    const calculatedFinish = getExpectedFinish(
      startedAt,
      finishedAt,
      duration,
      pausedTime,
      addedTime,
      endTime,
      timerType,
    );
    expect(calculatedFinish).toBe(10);
  });
  describe('on timers of type time-to-end', () => {
    it('finish time is as schedule + added time', () => {
      const startedAt = 10;
      const finishedAt = null;
      const duration = dayInMs;
      const pausedTime = 0;
      const addedTime = 10;
      const endTime = 30;
      const timerType = TimerType.TimeToEnd;
      const calculatedFinish = getExpectedFinish(
        startedAt,
        finishedAt,
        duration,
        pausedTime,
        addedTime,
        endTime,
        timerType,
      );
      expect(calculatedFinish).toBe(40);
    });
    it('handles events that finish the day after', () => {
      const startedAt = 79200000; // 22:00:00
      const finishedAt = null;
      const duration = Infinity; // not relevant
      const pausedTime = 0;
      const addedTime = 0;
      const endTime = 600000; // 00:10:00
      const timerType = TimerType.TimeToEnd;
      const calculatedFinish = getExpectedFinish(
        startedAt,
        finishedAt,
        duration,
        pausedTime,
        addedTime,
        endTime,
        timerType,
      );
      // expected finish is not a duration but a timetag
      expect(calculatedFinish).toBe(600000);
    });
  });
});

describe('getCurrent()', () => {
  it('is null if it hasnt started', () => {
    const startedAt = null;
    const duration = 0;
    const pausedTime = 0;
    const addedTime = 0;
    const clock = 0;
    const endTime = 0;
    const timerType = TimerType.CountDown;
    const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock, endTime, timerType);
    expect(current).toBe(null);
  });
  it('is the remaining time in clock', () => {
    const startedAt = 0;
    const duration = 10;
    const pausedTime = 0;
    const addedTime = 0;
    const clock = 1;
    const endTime = 10;
    const timerType = TimerType.CountDown;
    const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock, endTime, timerType);
    expect(current).toBe(9);
  });
  it('accounts for added times', () => {
    const startedAt = 0;
    const duration = 10;
    const pausedTime = 5;
    const addedTime = 5;
    const clock = 1;
    const endTime = 10;
    const timerType = TimerType.CountDown;
    const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock, endTime, timerType);
    expect(current).toBe(19);
  });
  it('counts over midnight', () => {
    const startedAt = 10;
    const duration = dayInMs + 10;
    const pausedTime = 0;
    const addedTime = 0;
    const clock = 10;
    const endTime = 20;
    const timerType = TimerType.CountDown;
    const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock, endTime, timerType);
    expect(current).toBe(dayInMs + 10);
  });
  it('rolls over midnight', () => {
    const startedAt = 10;
    const duration = dayInMs + 10;
    const pausedTime = 0;
    const addedTime = 0;
    const clock = 5;
    const endTime = 20;
    const timerType = TimerType.CountDown;
    const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock, endTime, timerType);
    expect(current).toBe(15);
  });
  it('midnight holds delays', () => {
    const startedAt = 10;
    const duration = dayInMs + 10;
    const pausedTime = 10;
    const addedTime = 10;
    const clock = 5;
    const endTime = 20;
    const timerType = TimerType.CountDown;
    const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock, endTime, timerType);
    expect(current).toBe(35);
  });
  describe('on timers of type time-to-end', () => {
    it('current time is the time to end', () => {
      const startedAt = 10;
      const duration = 100;
      const pausedTime = 0;
      const addedTime = 0;
      const clock = 30;
      const endTime = 100;
      const timerType = TimerType.TimeToEnd;
      const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock, endTime, timerType);
      expect(current).toBe(70);
    });
    it('current time is the time to end + added time', () => {
      const startedAt = 10;
      const duration = 100;
      const pausedTime = 3;
      const addedTime = 4;
      const clock = 30;
      const endTime = 100;
      const timerType = TimerType.TimeToEnd;
      const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock, endTime, timerType);
      expect(current).toBe(77);
    });
    it('handles events that finish the day after', () => {
      const startedAt = 79200000; // 22:00:00
      const duration = Infinity; // not relevant
      const pausedTime = 0;
      const addedTime = 0;
      const clock = 79500000; // 22:05:00
      const endTime = 600000; // 00:10:00
      const timerType = TimerType.TimeToEnd;
      const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock, endTime, timerType);
      expect(current).toBe(600000 + dayInMs - clock);
    });
  });
});

describe('getExpectedFinish() and getCurrentTime() combined', () => {
  it('without added times, they combine to be duration', () => {
    const startedAt = 0;
    const duration = 10;
    const finishedAt = null;
    const pausedTime = 0;
    const addedTime = 0;
    const clock = 0;
    const endTime = 10;
    const timerType = TimerType.CountDown;
    const expectedFinish = getExpectedFinish(
      startedAt,
      finishedAt,
      duration,
      pausedTime,
      addedTime,
      endTime,
      timerType,
    );
    const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock, endTime, timerType);
    const elapsed = duration - current;
    expect(expectedFinish).toBe(10);
    expect(elapsed).toBe(0);
    expect(current).toBe(10);
    expect(elapsed + current).toBe(10);
  });
  it('added times influence expected finish', () => {
    const startedAt = 0;
    const duration = 10;
    const finishedAt = null;
    const pausedTime = 1;
    const addedTime = 2;
    const clock = 5;
    const endTime = 10;
    const timerType = TimerType.CountDown;
    const expectedFinish = getExpectedFinish(
      startedAt,
      finishedAt,
      duration,
      pausedTime,
      addedTime,
      endTime,
      timerType,
    );
    const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock, endTime, timerType);
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

    let clock = previousTime;
    expect(skippedOutOfEvent(previousTime, clock, startedAt, expectedFinish, testSkipLimit)).toBe(false);

    clock += testSkipLimit;
    expect(skippedOutOfEvent(previousTime, clock, startedAt, expectedFinish, testSkipLimit)).toBe(false);
  });

  it('allows rolling backwards in an event', () => {
    const startedAt = 1000;
    const duration = 1000;
    const expectedFinish = startedAt + duration;
    const previousTime = startedAt + testSkipLimit / 2;

    let clock = previousTime;
    expect(skippedOutOfEvent(previousTime, clock, startedAt, expectedFinish, testSkipLimit)).toBe(false);

    clock -= testSkipLimit;
    expect(skippedOutOfEvent(previousTime, clock, startedAt, expectedFinish, testSkipLimit)).toBe(false);
  });

  it('accounts for crossing midnight', () => {
    const startedAt = dayInMs - testSkipLimit;
    const expectedFinish = 10;
    const previousTime = dayInMs - 1;

    let clock = previousTime;
    expect(skippedOutOfEvent(previousTime, clock, startedAt, expectedFinish, testSkipLimit)).toBe(false);

    clock = testSkipLimit - 2;
    expect(skippedOutOfEvent(previousTime, clock, startedAt, expectedFinish, testSkipLimit)).toBe(false);
  });

  it('allows rolling backwards in an event across midnight', () => {
    const startedAt = dayInMs - testSkipLimit;
    const expectedFinish = 10;
    const previousTime = startedAt + 1;

    let clock = previousTime;
    expect(skippedOutOfEvent(previousTime, clock, startedAt, expectedFinish, testSkipLimit)).toBe(false);

    clock -= testSkipLimit;
    expect(skippedOutOfEvent(previousTime, clock, startedAt, expectedFinish, testSkipLimit)).toBe(false);
  });

  it('finds skip forwards out of event', () => {
    const startedAt = 1000;
    const duration = 1000;
    const expectedFinish = startedAt + duration;
    const previousTime = expectedFinish - testSkipLimit / 2;

    let clock = previousTime;
    expect(skippedOutOfEvent(previousTime, clock, startedAt, expectedFinish, testSkipLimit)).toBe(false);

    clock += testSkipLimit + 1;
    expect(skippedOutOfEvent(previousTime, clock, startedAt, expectedFinish, testSkipLimit)).toBe(true);
  });

  it('finds skip backwards out of event', () => {
    const startedAt = 1000;
    const duration = 1000;
    const expectedFinish = startedAt + duration;
    const previousTime = startedAt + testSkipLimit / 2;

    let clock = previousTime;
    expect(skippedOutOfEvent(previousTime, clock, startedAt, expectedFinish, testSkipLimit)).toBe(false);

    clock -= testSkipLimit + 1;
    expect(skippedOutOfEvent(previousTime, clock, startedAt, expectedFinish, testSkipLimit)).toBe(true);
  });

  it('finds skip forwards out of event across midnight', () => {
    const startedAt = dayInMs - testSkipLimit;
    const expectedFinish = 10;
    const previousTime = dayInMs - 3;

    let clock = previousTime;
    expect(skippedOutOfEvent(previousTime, clock, startedAt, expectedFinish, testSkipLimit)).toBe(false);

    clock = testSkipLimit - 2;
    expect(skippedOutOfEvent(previousTime, clock, startedAt, expectedFinish, testSkipLimit)).toBe(true);
  });

  it('finds skip backwards out of event across midnight', () => {
    const startedAt = dayInMs - testSkipLimit;
    const expectedFinish = 10;
    const previousTime = startedAt + 1;

    let clock = previousTime;
    expect(skippedOutOfEvent(previousTime, clock, startedAt, expectedFinish, testSkipLimit)).toBe(false);

    clock -= testSkipLimit + 1;
    expect(skippedOutOfEvent(previousTime, clock, startedAt, expectedFinish, testSkipLimit)).toBe(true);
  });
});
