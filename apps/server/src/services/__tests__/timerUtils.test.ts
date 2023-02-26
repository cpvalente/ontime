import { getFinishTime } from '../timerUtils.js';

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
