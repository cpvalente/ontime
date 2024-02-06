import { EndAction, TimerType } from 'ontime-types';
import { expect } from 'vitest';

import { dayInMs } from '../timeConstants.js';
import { calculateDuration, validateEndAction, validateTimerType, validateTimes } from './validateEvent.js';

describe('validateEndAction()', () => {
  it('recognises a string representation of an action', () => {
    const endAction = validateEndAction('load-next');
    expect(endAction).toBe(EndAction.LoadNext);
  });
  it('returns fallback otherwise', () => {
    const emptyAction = validateEndAction('', EndAction.Stop);
    const invalidAction = validateEndAction('this-does-not-exist', EndAction.PlayNext);
    expect(emptyAction).toBe(EndAction.Stop);
    expect(invalidAction).toBe(EndAction.PlayNext);
  });
});

describe('validateTimerType()', () => {
  it('recognises a string representation of an action', () => {
    const timerType = validateTimerType('time-to-end');
    expect(timerType).toBe(TimerType.TimeToEnd);
  });
  it('returns fallback otherwise', () => {
    const emptyType = validateTimerType('', TimerType.Clock);
    const invalidType = validateTimerType('this-does-not-exist', TimerType.CountDown);
    expect(emptyType).toBe(TimerType.Clock);
    expect(invalidType).toBe(TimerType.CountDown);
  });
});

describe('validateTimes()', () => {
  it('passes through a well defined time list', () => {
    const { timeStart, timeEnd, duration } = validateTimes(5, 10, 5);
    expect(timeStart).toBe(5);
    expect(timeEnd).toBe(10);
    expect(duration).toBe(5);
  });

  it('handles cases when no times are given', () => {
    const { timeStart, timeEnd, duration } = validateTimes(null, undefined, null);
    expect(timeStart).toBe(0);
    expect(timeEnd).toBe(0);
    expect(duration).toBe(0);
  });

  it('calculates duration', () => {
    const { timeStart, timeEnd, duration } = validateTimes(5, 10);
    expect(timeStart).toBe(5);
    expect(timeEnd).toBe(10);
    expect(duration).toBe(5);
  });

  it('calculates end time', () => {
    const { timeStart, timeEnd, duration } = validateTimes(5, undefined, 10);
    expect(timeStart).toBe(5);
    expect(timeEnd).toBe(15);
    expect(duration).toBe(10);
  });

  it('handles events that finish the day after', () => {
    const { timeStart, timeEnd, duration } = validateTimes(100, 10);
    expect(timeStart).toBe(100);
    expect(timeEnd).toBe(10);
    expect(duration).toBe(dayInMs - 90);
  });

  it('corrects time in case of conflicts', () => {
    const { timeStart, timeEnd, duration } = validateTimes(5, 15, 15);
    expect(timeStart).toBe(5);
    expect(timeEnd).toBe(15);
    expect(duration).toBe(10);
  });

  it('calculates start time', () => {
    const { timeStart, timeEnd, duration } = validateTimes(undefined, 15, 10);
    expect(timeStart).toBe(5);
    expect(timeEnd).toBe(15);
    expect(duration).toBe(10);
  });

  it('calculates start and end time', () => {
    const { timeStart, timeEnd, duration } = validateTimes(undefined, undefined, 10);
    expect(timeStart).toBe(0);
    expect(timeEnd).toBe(10);
    expect(duration).toBe(10);
  });

  it('ensures values are integers', () => {
    const { timeStart, timeEnd, duration } = validateTimes(0.000001, 10.312335342, 10);
    expect(timeStart).toBe(0);
    expect(timeEnd).toBe(10);
    expect(duration).toBe(10);
  });

  it('ensures values dont overflow dayMs', () => {
    const start = 86100000;
    const endOverDay = 87420000;
    const durationNormal = 1320000;

    const { timeStart, timeEnd, duration } = validateTimes(start, endOverDay, durationNormal);
    expect(timeStart).toBe(start);
    expect(timeEnd).toBe(1020000);
    expect(duration).toBe(durationNormal);
  });
});

describe('calculateDuration()', () => {
  describe('Given start and end values', () => {
    it('is the difference between end and start', () => {
      const duration = calculateDuration(10, 20);
      expect(duration).toBe(10);
    });
  });

  describe('Handles edge cases', () => {
    it('handles events that go over midnight', () => {
      const duration = calculateDuration(51, 50);
      expect(duration).toBe(dayInMs - 1);
    });
    it('handles no difference', () => {
      const duration1 = calculateDuration(0, 0);
      const duration2 = calculateDuration(dayInMs, dayInMs);
      expect(duration1).toBe(0);
      expect(duration2).toBe(0);
    });
  });
});
