import { EndAction, TimerType } from 'ontime-types';
import { expect } from 'vitest';

import { validateEndAction, validateTimerType } from './validateEvent.js';

describe('validateEndAction()', () => {
  it('recognises a string representation of an action', () => {
    const endAction = validateEndAction('load-next');
    expect(endAction).toBe(EndAction.LoadNext);
  });
  it('returns fallback otherwise', () => {
    const emptyAction = validateEndAction('', EndAction.LoadNext);
    const invalidAction = validateEndAction('this-does-not-exist', EndAction.PlayNext);
    expect(emptyAction).toBe(EndAction.LoadNext);
    expect(invalidAction).toBe(EndAction.PlayNext);
  });
});

describe('validateTimerType()', () => {
  it('recognises a string representation of an action', () => {
    const timerType = validateTimerType('count-up');
    expect(timerType).toBe(TimerType.CountUp);
  });
  it('returns fallback otherwise', () => {
    const emptyType = validateTimerType('', TimerType.Clock);
    const invalidType = validateTimerType('this-does-not-exist', TimerType.CountDown);
    expect(emptyType).toBe(TimerType.Clock);
    expect(invalidType).toBe(TimerType.CountDown);
  });
  it('handles a null value from params', () => {
    const nullType = validateTimerType(null, TimerType.Clock);
    expect(nullType).toBe(TimerType.Clock);
  });
});
