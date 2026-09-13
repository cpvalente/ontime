import { TimerLifeCycle } from 'ontime-types';

import { getLifecycleLabel } from '../timerLifecycle';

describe('getLifecycleLabel', () => {
  it('returns the shared label for known lifecycle values', () => {
    expect(getLifecycleLabel(TimerLifeCycle.onClock)).toBe('Every second');
  });

  it('keeps unknown lifecycle values visible', () => {
    expect(getLifecycleLabel('future-lifecycle')).toBe('future-lifecycle');
  });
});
