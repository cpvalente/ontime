import { Offset, OffsetMode, Playback, TimerPhase, TimerState, TimerType } from 'ontime-types';

import { makeOntimeEvent, makeRundown } from '../../../api-data/rundown/__mocks__/rundown.mocks.js';
import {
  findNextPlayableId,
  findNextPlayableWithCue,
  findPreviousPlayableId,
  getEventAtIndex,
  getShouldClockUpdate,
  getShouldGroupTimerUpdate,
  getShouldOffsetUpdate,
  getShouldTimerUpdate,
  isNewSecond,
} from '../runtime.utils.js';

describe('isNewSecond()', () => {
  it('is false while the value moves within the same second', () => {
    // count down rounds up, so both resolve to second 2
    expect(isNewSecond(1500, 1200)).toBe(false);
  });

  it('is true once the value crosses a second boundary', () => {
    expect(isNewSecond(1001, 1000)).toBe(true);
  });

  it('rounds according to the given direction', () => {
    // 1200 -> ceil 2 / floor 1, 1800 -> ceil 2 / floor 1
    expect(isNewSecond(1200, 1800, TimerType.CountDown)).toBe(false);
    expect(isNewSecond(1200, 1800, TimerType.CountUp)).toBe(false);
    // 1200 -> ceil 2 / floor 1, 2200 -> ceil 3 / floor 2
    expect(isNewSecond(1200, 2200, TimerType.CountDown)).toBe(true);
    expect(isNewSecond(1200, 2200, TimerType.CountUp)).toBe(true);
  });

  it('treats null and undefined as second zero', () => {
    expect(isNewSecond(undefined, null)).toBe(false);
    expect(isNewSecond(null, 0)).toBe(false);
    expect(isNewSecond(undefined, 500)).toBe(true);
  });
});

describe('getShouldClockUpdate()', () => {
  it('is false within the same second and true across the boundary', () => {
    expect(getShouldClockUpdate(1000, 1999)).toBe(false);
    expect(getShouldClockUpdate(1000, 2000)).toBe(true);
  });
});

describe('getShouldTimerUpdate()', () => {
  const baseTimer: TimerState = {
    addedTime: 0,
    current: 10000,
    duration: 10000,
    elapsed: 0,
    expectedFinish: 10000,
    phase: TimerPhase.Default,
    playback: Playback.Play,
    secondaryTimer: null,
    startedAt: 0,
  };

  it('always updates when there is no previous state', () => {
    expect(getShouldTimerUpdate(undefined, baseTimer)).toBe(true);
  });

  it('does not update while the timer ticks within the same second', () => {
    expect(getShouldTimerUpdate(baseTimer, { ...baseTimer, current: 9500 })).toBe(false);
  });

  it('updates when the timer crosses a second', () => {
    expect(getShouldTimerUpdate(baseTimer, { ...baseTimer, current: 8999 })).toBe(true);
  });

  it('updates when the secondary timer crosses a second', () => {
    const previous = { ...baseTimer, secondaryTimer: 2000 };
    // counting down rounds up, so 1999 is still second 2
    expect(getShouldTimerUpdate(previous, { ...previous, secondaryTimer: 1999 })).toBe(false);
    expect(getShouldTimerUpdate(previous, { ...previous, secondaryTimer: 1000 })).toBe(true);
  });

  it.each([
    ['addedTime', { addedTime: 1 }],
    ['duration', { duration: 1 }],
    ['phase', { phase: TimerPhase.Warning }],
    ['playback', { playback: Playback.Pause }],
    ['startedAt', { startedAt: 1 }],
  ])('updates immediately when %s changes', (_label, patch) => {
    expect(getShouldTimerUpdate(baseTimer, { ...baseTimer, ...patch })).toBe(true);
  });

  it.each([
    ['elapsed', { elapsed: 1 }],
    ['expectedFinish', { expectedFinish: 1 }],
  ])('does not update on %s alone, since it is derived', (_label, patch) => {
    expect(getShouldTimerUpdate(baseTimer, { ...baseTimer, ...patch })).toBe(false);
  });
});

describe('getShouldGroupTimerUpdate()', () => {
  const timer: TimerState = {
    addedTime: 0,
    current: 10_000,
    duration: 10_000,
    elapsed: 0,
    expectedFinish: null,
    phase: TimerPhase.Default,
    playback: Playback.Play,
    secondaryTimer: null,
    startedAt: 0,
  };

  it('updates when a group timer appears or disappears', () => {
    expect(getShouldGroupTimerUpdate(null, timer)).toBe(true);
    expect(getShouldGroupTimerUpdate(timer, null)).toBe(true);
  });

  it('does not repeatedly publish an absent group timer', () => {
    expect(getShouldGroupTimerUpdate(null, null)).toBe(false);
  });

  it('uses normal timer tick semantics while a group timer exists', () => {
    expect(getShouldGroupTimerUpdate(timer, { ...timer, current: 9_500 })).toBe(false);
    expect(getShouldGroupTimerUpdate(timer, { ...timer, current: 8_999 })).toBe(true);
  });
});

describe('getShouldOffsetUpdate()', () => {
  const baseOffset: Offset = {
    absolute: 0,
    relative: 0,
    mode: OffsetMode.Absolute,
    expectedGroupEnd: null,
    expectedRundownEnd: null,
    expectedFlagStart: null,
  };

  it('always updates when there is no previous state', () => {
    expect(getShouldOffsetUpdate(undefined, baseOffset, false)).toBe(true);
  });

  it('updates on a mode change even when no dependency ticked', () => {
    expect(getShouldOffsetUpdate(baseOffset, { ...baseOffset, mode: OffsetMode.Relative }, false)).toBe(true);
  });

  it('holds back value changes until a dependency ticks', () => {
    const next = { ...baseOffset, absolute: 1000 };
    expect(getShouldOffsetUpdate(baseOffset, next, false)).toBe(false);
    expect(getShouldOffsetUpdate(baseOffset, next, true)).toBe(true);
  });

  it('does not update when a dependency ticked but nothing changed', () => {
    expect(getShouldOffsetUpdate(baseOffset, { ...baseOffset }, true)).toBe(false);
  });
});

describe('findPreviousPlayableId()', () => {
  const order = ['1', '2', '3'];

  it('returns undefined when there is nothing to play', () => {
    expect(findPreviousPlayableId([])).toBeUndefined();
  });

  it('returns the first event when nothing is loaded', () => {
    expect(findPreviousPlayableId(order)).toBe('1');
  });

  it('returns the preceding event', () => {
    expect(findPreviousPlayableId(order, '3')).toBe('2');
  });

  it('stays on the first event when already at the top', () => {
    expect(findPreviousPlayableId(order, '1')).toBe('1');
  });

  it('falls back to the first event when the loaded id is unknown', () => {
    expect(findPreviousPlayableId(order, 'not-in-rundown')).toBe('1');
  });
});

describe('findNextPlayableId()', () => {
  const order = ['1', '2', '3'];

  it('returns undefined when there is nothing to play', () => {
    expect(findNextPlayableId([])).toBeUndefined();
  });

  it('returns the first event when nothing is loaded', () => {
    expect(findNextPlayableId(order)).toBe('1');
  });

  it('returns the following event', () => {
    expect(findNextPlayableId(order, '1')).toBe('2');
  });

  it('wraps to the first event from the last', () => {
    expect(findNextPlayableId(order, '3')).toBe('1');
  });

  it('falls back to the first event when the loaded id is unknown', () => {
    expect(findNextPlayableId(order, 'not-in-rundown')).toBe('1');
  });
});

describe('findNextPlayableWithCue()', () => {
  const rundown = makeRundown({
    order: ['1', '2', '3', '4'],
    entries: {
      '1': makeOntimeEvent({ id: '1', cue: 'a' }),
      '2': makeOntimeEvent({ id: '2', cue: 'b' }),
      '3': makeOntimeEvent({ id: '3', cue: 'b', skip: true }),
      '4': makeOntimeEvent({ id: '4', cue: 'b' }),
    },
  });
  const order = ['1', '2', '3', '4'];

  it('finds the next event with the given cue', () => {
    expect(findNextPlayableWithCue(rundown, order, 'b')?.id).toBe('2');
  });

  it('skips events which are not playable', () => {
    expect(findNextPlayableWithCue(rundown, order, 'b', 2)?.id).toBe('4');
  });

  it('wraps around to the start of the rundown', () => {
    expect(findNextPlayableWithCue(rundown, order, 'a', 2)?.id).toBe('1');
  });

  it('excludes the current event unless allowCurrent is set', () => {
    expect(findNextPlayableWithCue(rundown, order, 'b', 1)?.id).toBe('4');
    expect(findNextPlayableWithCue(rundown, order, 'b', 1, true)?.id).toBe('2');
  });

  it('returns undefined when no event carries the cue', () => {
    expect(findNextPlayableWithCue(rundown, order, 'missing')).toBeUndefined();
  });
});

describe('getEventAtIndex()', () => {
  const rundown = makeRundown({
    order: ['1', '2'],
    entries: {
      '1': makeOntimeEvent({ id: '1' }),
      '2': makeOntimeEvent({ id: '2' }),
    },
  });

  it('returns the event at the given index', () => {
    expect(getEventAtIndex(rundown, ['1', '2'], 1)?.id).toBe('2');
  });

  it('returns undefined when the index is out of range', () => {
    expect(getEventAtIndex(rundown, ['1', '2'], 5)).toBeUndefined();
    expect(getEventAtIndex(rundown, [], 0)).toBeUndefined();
  });
});
