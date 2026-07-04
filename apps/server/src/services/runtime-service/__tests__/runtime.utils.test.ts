/**
 * Characterisation tests for the change-detection predicates that gate
 * what gets broadcast to clients on every tick
 */
import { Offset, OffsetMode, PlayableEvent, Playback, TimerPhase, TimerState, TimerType } from 'ontime-types';

import { makeOntimeEvent } from '../../../api-data/rundown/__mocks__/rundown.mocks.js';
import { makeRuntimeStateData } from '../../../stores/__mocks__/runtimeState.mocks.js';
import type { RuntimeState } from '../../../stores/runtimeState.js';
import {
  collectRuntimeStateChanges,
  getShouldClockUpdate,
  getShouldOffsetUpdate,
  getShouldTimerUpdate,
  isNewSecond,
} from '../runtime.utils.js';

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

describe('collectRuntimeStateChanges()', () => {
  test('the very first run emits everything and counts as an immediate change', () => {
    const previousState = {} as RuntimeState;
    const state = makeRuntimeStateData();

    const { patch, hasImmediateChanges } = collectRuntimeStateChanges(previousState, state);

    expect(Object.keys(patch).sort()).toStrictEqual(['clock', 'offset', 'rundown', 'timer']);
    expect(hasImmediateChanges).toBe(true);
    // the emitted keys are persisted into the previous state for the next diff
    expect(previousState.timer).toStrictEqual(state.timer);
    expect(previousState.offset).toStrictEqual(state.offset);
  });

  test('an unchanged state emits nothing', () => {
    const previousState = makeRuntimeStateData();
    const state = makeRuntimeStateData();

    const { patch, hasImmediateChanges } = collectRuntimeStateChanges(previousState, state);

    expect(patch).toStrictEqual({});
    expect(hasImmediateChanges).toBe(false);
  });

  test('a playback change emits timer and clock together', () => {
    const previousState = makeRuntimeStateData();
    const state = makeRuntimeStateData({ timer: { playback: Playback.Armed } });

    const { patch, hasImmediateChanges } = collectRuntimeStateChanges(previousState, state);

    expect(Object.keys(patch).sort()).toStrictEqual(['clock', 'timer']);
    expect(hasImmediateChanges).toBe(true);
  });

  test('an offset change is gated on a timer/clock dependency', () => {
    // nothing else changed: the offset is held back
    const previousState = makeRuntimeStateData();
    const state = makeRuntimeStateData({ offset: { absolute: 1000 } });

    const gated = collectRuntimeStateChanges(previousState, state);
    expect(gated.patch).toStrictEqual({});

    // with a clock rollover, the offset rides along
    const stateWithClock = makeRuntimeStateData({ clock: 1000, offset: { absolute: 1000 } });
    const emitted = collectRuntimeStateChanges(previousState, stateWithClock);
    expect(Object.keys(emitted.patch).sort()).toStrictEqual(['clock', 'offset']);
  });

  test('!!! characterised bug: changed entries drip out one per call', () => {
    const previousState = makeRuntimeStateData();
    const eventNow = makeOntimeEvent({ id: 'now' }) as PlayableEvent;
    const eventNext = makeOntimeEvent({ id: 'next' }) as PlayableEvent;
    const state = makeRuntimeStateData({ eventNow, eventNext });

    // both entries changed, but the ||= short-circuit only diffs the first
    const first = collectRuntimeStateChanges(previousState, state);
    expect(Object.keys(first.patch).sort()).toStrictEqual(['eventNow']);

    // the second call flushes the next pending entry
    const second = collectRuntimeStateChanges(previousState, state);
    expect(Object.keys(second.patch).sort()).toStrictEqual(['eventNext']);

    // from here on, nothing is pending
    const third = collectRuntimeStateChanges(previousState, state);
    expect(third.patch).toStrictEqual({});
  });

  test('rundown data changes are emitted on deep difference', () => {
    const previousState = makeRuntimeStateData();
    const state = makeRuntimeStateData({ rundown: { actualStart: 1000 } });

    const { patch } = collectRuntimeStateChanges(previousState, state);
    expect(Object.keys(patch).sort()).toStrictEqual(['rundown']);
  });

  test('addedTime changes count as immediate and emit the timer', () => {
    const previousState = makeRuntimeStateData();
    const state = makeRuntimeStateData({ timer: { addedTime: 60_000 } });

    const { patch, hasImmediateChanges } = collectRuntimeStateChanges(previousState, state);
    expect(Object.keys(patch).sort()).toStrictEqual(['clock', 'timer']);
    expect(hasImmediateChanges).toBe(true);
  });

  test('an offset mode change is immediate and bypasses the dependency gate', () => {
    const previousState = makeRuntimeStateData();
    const state = makeRuntimeStateData({ offset: { mode: OffsetMode.Relative } });

    const { patch, hasImmediateChanges } = collectRuntimeStateChanges(previousState, state);
    expect(Object.keys(patch).sort()).toStrictEqual(['offset']);
    expect(hasImmediateChanges).toBe(true);
  });
});
