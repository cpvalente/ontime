/**
 * Characterisation tests for the change-detection predicates that gate
 * what gets broadcast to clients on every tick
 */
import { Offset, OffsetMode, Playback, TimerPhase, TimerState, TimerType } from 'ontime-types';

import { getShouldClockUpdate, getShouldOffsetUpdate, getShouldTimerUpdate, isNewSecond } from '../runtime.utils.js';

const baseTimer: TimerState = {
  addedTime: 0,
  current: 10_000,
  duration: 60_000,
  elapsed: 50_000,
  expectedFinish: 100_000,
  phase: TimerPhase.Default,
  playback: Playback.Play,
  secondaryTimer: null,
  startedAt: 1000,
};

function makeTimer(patch: Partial<TimerState>): TimerState {
  return { ...baseTimer, ...patch };
}

const baseOffset: Offset = {
  absolute: 0,
  relative: 0,
  mode: OffsetMode.Absolute,
  expectedGroupEnd: null,
  expectedRundownEnd: null,
  expectedFlagStart: null,
};

describe('isNewSecond()', () => {
  describe('count down (default): seconds are rounded up', () => {
    test.each([
      // [previous, current, expected]
      [1500, 1200, false], // both round to 2
      [1500, 1000, true], // 2 -> 1
      [1000, 999, false], // both round to 1
      [999, 1, false], // both round to 1
      [1, 0, true], // 1 -> 0
      [0, -999, false], // both round to 0
      [-1, -1000, true], // 0 -> -1
    ])('%s -> %s is a new second: %s', (previous, current, expected) => {
      expect(isNewSecond(previous, current)).toBe(expected);
    });

    test('null and undefined values are coerced to second 0', () => {
      expect(isNewSecond(undefined, 0)).toBe(false);
      expect(isNewSecond(null, 0)).toBe(false);
      expect(isNewSecond(undefined, 1000)).toBe(true);
      expect(isNewSecond(0, null)).toBe(false);
    });
  });

  describe('count up: seconds are rounded down', () => {
    test.each([
      [999, 1, false], // both round to 0
      [999, 1000, true], // 0 -> 1
      [1000, 1999, false], // both round to 1
    ])('%s -> %s is a new second: %s', (previous, current, expected) => {
      expect(isNewSecond(previous, current, TimerType.CountUp)).toBe(expected);
    });
  });
});

describe('getShouldClockUpdate()', () => {
  test('updates when the clock rolls into a new second', () => {
    expect(getShouldClockUpdate(500, 999)).toBe(false);
    expect(getShouldClockUpdate(999, 1000)).toBe(true);
    expect(getShouldClockUpdate(1000, 1032)).toBe(false);
  });

  test('updates when the clock wraps around midnight', () => {
    expect(getShouldClockUpdate(86_399_999, 0)).toBe(true);
  });
});

describe('getShouldTimerUpdate()', () => {
  test('always updates when there is no previous state', () => {
    expect(getShouldTimerUpdate(undefined, baseTimer)).toBe(true);
  });

  test('does not update when nothing changed', () => {
    expect(getShouldTimerUpdate(baseTimer, makeTimer({}))).toBe(false);
  });

  test('current triggers only on a new second', () => {
    // 10_000 and 9_001 both round up to second 10
    expect(getShouldTimerUpdate(baseTimer, makeTimer({ current: 9001 }))).toBe(false);
    expect(getShouldTimerUpdate(baseTimer, makeTimer({ current: 9000 }))).toBe(true);
  });

  test('secondaryTimer triggers only on a new second', () => {
    const previous = makeTimer({ secondaryTimer: 5000 });
    expect(getShouldTimerUpdate(previous, makeTimer({ secondaryTimer: 4001 }))).toBe(false);
    expect(getShouldTimerUpdate(previous, makeTimer({ secondaryTimer: 4000 }))).toBe(true);
  });

  test.each([
    ['addedTime', { addedTime: 1000 }],
    ['duration', { duration: 61_000 }],
    ['phase', { phase: TimerPhase.Warning }],
    ['playback', { playback: Playback.Pause }],
    ['startedAt', { startedAt: 2000 }],
  ] as const)('%s triggers on any change', (_field, patch) => {
    expect(getShouldTimerUpdate(baseTimer, makeTimer(patch))).toBe(true);
  });

  test.each([
    ['elapsed', { elapsed: 50_500 }],
    ['expectedFinish', { expectedFinish: 100_500 }],
  ] as const)('%s is deliberately not checked', (_field, patch) => {
    expect(getShouldTimerUpdate(baseTimer, makeTimer(patch))).toBe(false);
  });
});

describe('getShouldOffsetUpdate()', () => {
  test('always updates when there is no previous state', () => {
    expect(getShouldOffsetUpdate(undefined, baseOffset, false)).toBe(true);
  });

  test('mode change triggers regardless of dependencies', () => {
    const current = { ...baseOffset, mode: OffsetMode.Relative };
    expect(getShouldOffsetUpdate(baseOffset, current, false)).toBe(true);
  });

  test('value changes are gated by the dependency update', () => {
    const current = { ...baseOffset, absolute: 1000 };
    // a changed offset without a timer/clock update is not emitted
    expect(getShouldOffsetUpdate(baseOffset, current, false)).toBe(false);
    expect(getShouldOffsetUpdate(baseOffset, current, true)).toBe(true);
  });

  test('does not update when deep-equal, even with a dependency update', () => {
    expect(getShouldOffsetUpdate(baseOffset, { ...baseOffset }, true)).toBe(false);
  });

  test('expected times participate in the deep comparison', () => {
    const current = { ...baseOffset, expectedRundownEnd: 1000 };
    expect(getShouldOffsetUpdate(baseOffset, current, true)).toBe(true);
  });
});
