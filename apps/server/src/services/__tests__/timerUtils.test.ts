import { dayInMs } from 'ontime-utils';

import { getCurrent, getElapsed, getExpectedFinish } from '../timerUtils.js';

describe('getExpectedFinish()', () => {
  it('is null if we havent started', () => {
    const startedAt = null;
    const finishedAt = null;
    const duration = 10;
    const pausedTime = 0;
    const addedTime = 0;
    const calculatedFinish = getExpectedFinish(startedAt, finishedAt, duration, pausedTime, addedTime);
    expect(calculatedFinish).toBe(null);
  });
  it('is finishedAt if defined', () => {
    const startedAt = 10;
    const finishedAt = 20;
    const duration = 10;
    const pausedTime = 0;
    const addedTime = 0;
    const calculatedFinish = getExpectedFinish(startedAt, finishedAt, duration, pausedTime, addedTime);
    expect(calculatedFinish).toBe(finishedAt);
  });
  it('calculates the finish time', () => {
    const startedAt = 1;
    const finishedAt = null;
    const duration = 10;
    const pausedTime = 0;
    const addedTime = 0;
    const calculatedFinish = getExpectedFinish(startedAt, finishedAt, duration, pausedTime, addedTime);
    expect(calculatedFinish).toBe(11);
  });
  it('adds paused and added times', () => {
    const startedAt = 1;
    const finishedAt = null;
    const duration = 10;
    const pausedTime = 10;
    const addedTime = 10;
    const calculatedFinish = getExpectedFinish(startedAt, finishedAt, duration, pausedTime, addedTime);
    expect(calculatedFinish).toBe(31);
  });
  it('added time could be negative', () => {
    const startedAt = 1;
    const finishedAt = null;
    const duration = 10;
    const pausedTime = 10;
    const addedTime = -10;
    const calculatedFinish = getExpectedFinish(startedAt, finishedAt, duration, pausedTime, addedTime);
    expect(calculatedFinish).toBe(11);
  });
  it('user could add enough time for it to be negative', () => {
    const startedAt = 1;
    const finishedAt = null;
    const duration = 10;
    const pausedTime = 0;
    const addedTime = -100;
    const calculatedFinish = getExpectedFinish(startedAt, finishedAt, duration, pausedTime, addedTime);
    expect(calculatedFinish).toBe(1);
  });
  it('timer can have no duration', () => {
    const startedAt = 1;
    const finishedAt = null;
    const duration = 0;
    const pausedTime = 0;
    const addedTime = 0;
    const calculatedFinish = getExpectedFinish(startedAt, finishedAt, duration, pausedTime, addedTime);
    expect(calculatedFinish).toBe(1);
  });
  it('finish can be the day after', () => {
    const startedAt = 10;
    const finishedAt = null;
    const duration = dayInMs;
    const pausedTime = 0;
    const addedTime = 0;
    const calculatedFinish = getExpectedFinish(startedAt, finishedAt, duration, pausedTime, addedTime);
    expect(calculatedFinish).toBe(10);
  });
});

describe('getCurrent()', () => {
  it('is null if it hasnt started', () => {
    const startedAt = null;
    const duration = 0;
    const pausedTime = 0;
    const addedTime = 0;
    const clock = 0;
    const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock);
    expect(current).toBe(null);
  });
  it('is the remaining time in clock', () => {
    const startedAt = 0;
    const duration = 10;
    const pausedTime = 0;
    const addedTime = 0;
    const clock = 1;
    const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock);
    expect(current).toBe(9);
  });
  it('accounts for added times', () => {
    const startedAt = 0;
    const duration = 10;
    const pausedTime = 5;
    const addedTime = 5;
    const clock = 1;
    const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock);
    expect(current).toBe(19);
  });
  it('counts over midnight', () => {
    const startedAt = 10;
    const duration = dayInMs + 10;
    const pausedTime = 0;
    const addedTime = 0;
    const clock = 10;
    const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock);
    expect(current).toBe(dayInMs + 10);
  });
  it('rolls over midnight', () => {
    const startedAt = 10;
    const duration = dayInMs + 10;
    const pausedTime = 0;
    const addedTime = 0;
    const clock = 5;
    const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock);
    expect(current).toBe(15);
  });
  it('midnight holds delays', () => {
    const startedAt = 10;
    const duration = dayInMs + 10;
    const pausedTime = 10;
    const addedTime = 10;
    const clock = 5;
    const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock);
    expect(current).toBe(35);
  });
});

describe('getElapsedTime()', () => {
  it('time since we started', () => {
    const startedAt = 0;
    const clock = 5;
    const elapsed = getElapsed(startedAt, clock);
    expect(elapsed).toBe(5);
  });
  it('rolls past midnight', () => {
    const startedAt = 10;
    const clock = 5;
    const elapsed = getElapsed(startedAt, clock);

    expect(elapsed).toBe(dayInMs - startedAt + clock);
  });
});

describe('getExpectedFinish() getElapsedTime() and getCurrentTime() combined', () => {
  it('without added times, they combine to be duration', () => {
    const startedAt = 0;
    const duration = 10;
    const finishedAt = null;
    const pausedTime = 0;
    const addedTime = 0;
    const clock = 0;
    const expectedFinish = getExpectedFinish(startedAt, finishedAt, duration, pausedTime, addedTime);
    const elapsed = getElapsed(startedAt, clock);
    const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock);
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
    const expectedFinish = getExpectedFinish(startedAt, finishedAt, duration, pausedTime, addedTime);
    const elapsed = getElapsed(startedAt, clock);
    const current = getCurrent(startedAt, duration, addedTime, pausedTime, clock);
    expect(expectedFinish).toBe(13);
    expect(elapsed).toBe(5);
    expect(current).toBe(8);
  });
});
