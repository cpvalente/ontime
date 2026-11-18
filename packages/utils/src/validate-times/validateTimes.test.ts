import type { OntimeEvent } from 'ontime-types';
import { TimeStrategy } from 'ontime-types';

import { dayInMs } from '../date-utils/conversionUtils';
import { getLinkedTimes, validateTimes } from './validateTimes';

describe('validateTimes()', () => {
  describe('when time strategy is inferred', () => {
    it('passes through a well defined time list', () => {
      const { timeStart, timeEnd, duration, timeStrategy } = validateTimes(5, 10, 5);
      expect(timeStart).toBe(5);
      expect(timeEnd).toBe(10);
      expect(duration).toBe(5);
      expect(timeStrategy).toBe(TimeStrategy.LockDuration);
    });

    it('handles cases when no times are given', () => {
      const { timeStart, timeEnd, duration, timeStrategy } = validateTimes(null, undefined, null);
      expect(timeStart).toBe(0);
      expect(timeEnd).toBe(0);
      expect(duration).toBe(0);
      expect(timeStrategy).toBe(TimeStrategy.LockDuration);
    });

    it('calculates duration', () => {
      const { timeStart, timeEnd, duration, timeStrategy } = validateTimes(5, 10, undefined);
      expect(timeStart).toBe(5);
      expect(timeEnd).toBe(10);
      expect(duration).toBe(5);
      expect(timeStrategy).toBe(TimeStrategy.LockEnd);
    });

    it('calculates end time', () => {
      const { timeStart, timeEnd, duration, timeStrategy } = validateTimes(5, undefined, 10);
      expect(timeStart).toBe(5);
      expect(timeEnd).toBe(15);
      expect(duration).toBe(10);
      expect(timeStrategy).toBe(TimeStrategy.LockDuration);
    });

    it('handles events that finish the day after', () => {
      const { timeStart, timeEnd, duration, timeStrategy } = validateTimes(100, 10, undefined);
      expect(timeStart).toBe(100);
      expect(timeEnd).toBe(10);
      expect(duration).toBe(dayInMs - 90);
      expect(timeStrategy).toBe(TimeStrategy.LockEnd);
    });

    it('handles events with no duration', () => {
      const { timeStart, timeEnd, duration } = validateTimes(10, 10, undefined);
      expect(timeStart).toBe(10);
      expect(timeEnd).toBe(10);
      expect(duration).toBe(0);
    });

    it('corrects time in case of conflicts', () => {
      const { timeStart, timeEnd, duration, timeStrategy } = validateTimes(5, 15, 15);
      expect(timeStart).toBe(5);
      expect(timeEnd).toBe(15);
      expect(duration).toBe(10);
      expect(timeStrategy).toBe(TimeStrategy.LockDuration);
    });

    it('calculates start time', () => {
      const { timeStart, timeEnd, duration, timeStrategy } = validateTimes(undefined, 15, 10);
      expect(timeStart).toBe(5);
      expect(timeEnd).toBe(15);
      expect(duration).toBe(10);
      expect(timeStrategy).toBe(TimeStrategy.LockDuration);
    });

    it('calculates start and end time', () => {
      const { timeStart, timeEnd, duration, timeStrategy } = validateTimes(undefined, undefined, 10);
      expect(timeStart).toBe(0);
      expect(timeEnd).toBe(10);
      expect(duration).toBe(10);
      expect(timeStrategy).toBe(TimeStrategy.LockDuration);
    });

    it('ensures values are integers', () => {
      const { timeStart, timeEnd, duration, timeStrategy } = validateTimes(0.000001, 10.312335342, 10);
      expect(timeStart).toBe(0);
      expect(timeEnd).toBe(10);
      expect(duration).toBe(10);
      expect(timeStrategy).toBe(TimeStrategy.LockDuration);
    });
    it('prevents values from overflowing', () => {
      const { timeStart, timeEnd, duration, timeStrategy } = validateTimes(dayInMs - 5, undefined, 10);
      expect(timeStart).toBe(dayInMs - 5);
      expect(timeEnd).toBe(5);
      expect(duration).toBe(10);
      expect(timeStrategy).toBe(TimeStrategy.LockDuration);
    });
  });
  describe('when time strategy is given', () => {
    it('calculates end', () => {
      const { timeStart, timeEnd, duration, timeStrategy } = validateTimes(5, 20, 20, TimeStrategy.LockDuration);
      expect(timeStart).toBe(5);
      expect(timeEnd).toBe(25);
      expect(duration).toBe(20);
      expect(timeStrategy).toBe(TimeStrategy.LockDuration);
    });
    it('calculates duration', () => {
      const { timeStart, timeEnd, duration, timeStrategy } = validateTimes(5, 20, 20, TimeStrategy.LockEnd);
      expect(timeStart).toBe(5);
      expect(timeEnd).toBe(20);
      expect(duration).toBe(15);
      expect(timeStrategy).toBe(TimeStrategy.LockEnd);
    });
  });
});

describe('getLinkedTimes()', () => {
  it('returns times with lock end', () => {
    const source = {
      timeStart: 5,
      timeEnd: 15,
      duration: 10,
    } as OntimeEvent;
    const target = {
      timeStart: 10,
      timeEnd: 20,
      duration: 10,
      timeStrategy: TimeStrategy.LockEnd,
    } as OntimeEvent;

    const timePatch = getLinkedTimes(target, source);
    expect(timePatch).toStrictEqual({
      timeStart: 15,
      timeEnd: 20,
      duration: 5,
    });
  });

  it('returns times with lock duration', () => {
    const source = {
      timeStart: 5,
      timeEnd: 15,
      duration: 10,
    } as OntimeEvent;
    const target = {
      timeStart: 10,
      timeEnd: 20,
      duration: 10,
      timeStrategy: TimeStrategy.LockDuration,
    } as OntimeEvent;

    const timePatch = getLinkedTimes(target, source);
    expect(timePatch).toStrictEqual({
      timeStart: 15,
      timeEnd: 25,
      duration: 10,
    });
  });

  it('prevents overflow', () => {
    const source = {
      timeStart: 5,
      timeEnd: dayInMs - 5,
      duration: 10,
    } as OntimeEvent;
    const target = {
      timeStart: 0,
      timeEnd: 20,
      duration: 10,
      timeStrategy: TimeStrategy.LockDuration,
    } as OntimeEvent;

    const timePatch = getLinkedTimes(target, source);
    expect(timePatch).toStrictEqual({
      timeStart: dayInMs - 5,
      timeEnd: 5,
      duration: 10,
    });
  });
});
