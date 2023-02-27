import { getCurrentTime, getElapsed, getFinishTime } from '../timerUtils.js';

describe('getFinishTime()', () => {
  it('calculates the finish time', () => {
    const startedAt = 1;
    const duration = 10;
    const pausedTime = 0;
    const addedTime = 0;
    const calculatedFinish = getFinishTime(startedAt, duration, pausedTime, addedTime);
    expect(calculatedFinish).toBe(11);
  });
  it('adds paused and added times', () => {
    const startedAt = 1;
    const duration = 10;
    const pausedTime = 10;
    const addedTime = 10;
    const calculatedFinish = getFinishTime(startedAt, duration, pausedTime, addedTime);
    expect(calculatedFinish).toBe(31);
  });
  it('added time could be negative', () => {
    const startedAt = 1;
    const duration = 10;
    const pausedTime = 10;
    const addedTime = -10;
    const calculatedFinish = getFinishTime(startedAt, duration, pausedTime, addedTime);
    expect(calculatedFinish).toBe(11);
  });
  it('user could add enough time for it to be negative', () => {
    const startedAt = 1;
    const duration = 10;
    const pausedTime = 0;
    const addedTime = -100;
    const calculatedFinish = getFinishTime(startedAt, duration, pausedTime, addedTime);
    expect(calculatedFinish).toBe(1);
  });
  it('timer can have no duration', () => {
    const startedAt = 1;
    const duration = 0;
    const pausedTime = 0;
    const addedTime = 0;
    const calculatedFinish = getFinishTime(startedAt, duration, pausedTime, addedTime);
    expect(calculatedFinish).toBe(1);
  });
});

describe('getCurrentTime()', () => {
  it('is expectedFinish if it hasnt started', () => {
    const expectedFinish = 10;
    const pausedTime = 0;
    const addedTime = 0;
    const clock = 0;
    const current = getCurrentTime(expectedFinish, pausedTime, addedTime, clock);
    expect(current).toBe(10);
  });
  it('is the remaining time in clock', () => {
    const expectedFinish = 10;
    const pausedTime = 0;
    const addedTime = 0;
    const clock = 1;
    const current = getCurrentTime(expectedFinish, pausedTime, addedTime, clock);
    expect(current).toBe(9);
  });
  it('it adds considers added time', () => {
    const expectedFinish = 10;
    const pausedTime = 3;
    const addedTime = 2;
    const clock = 1;
    const current = getCurrentTime(expectedFinish, pausedTime, addedTime, clock);
    expect(current).toBe(14);
  });
});

describe('getElapsedTime()', () => {
  it('time since we started', () => {
    const startedAt = 0;
    const clock = 5;
    const elapsed = getElapsed(startedAt, clock);
    expect(elapsed).toBe(5);
  });
  it('clock cannot be lower than started time', () => {
    const startedAt = 10;
    const clock = 5;
    expect(() => getElapsed(startedAt, clock)).toThrow();
  });
});

describe('getElapsedTime() and getCurrentTime() combined', () => {
  it('without added times, they combine to be duration', () => {
    const startedAt = 0;
    const expectedFinish = 10;
    const pausedTime = 0;
    const addedTime = 0;
    const clock = 0;
    const elapsed = getElapsed(startedAt, clock);
    const current = getCurrentTime(expectedFinish, pausedTime, addedTime, clock);
    expect(elapsed).toBe(0);
    expect(current).toBe(10);
    expect(elapsed + current).toBe(10);
  });
  it('without added times, they are each others compliment', () => {
    const startedAt = 0;
    const expectedFinish = 10;
    const pausedTime = 0;
    const addedTime = 0;
    const clock = 5;
    const elapsed = getElapsed(startedAt, clock);
    const current = getCurrentTime(expectedFinish, pausedTime, addedTime, clock);
    expect(elapsed).toBe(5);
    expect(current).toBe(5);
    expect(elapsed + current).toBe(10);
  });
  it('elapsed times do not account to paused or added times', () => {
    const startedAt = 0;
    const expectedFinish = 10;
    const pausedTime = 3;
    const addedTime = 0;
    const clock = 5;
    const elapsed = getElapsed(startedAt, clock);
    const current = getCurrentTime(expectedFinish, pausedTime, addedTime, clock);
    expect(elapsed).toBe(5);
    expect(current).toBe(8);
  });
});
