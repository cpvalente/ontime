import { OntimeEvent, OntimeGroup, RundownEntries, TimerType } from 'ontime-types';
import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';
import { describe, expect, it } from 'vitest';

import { timerPlaceholder, timerPlaceholderMin } from '../../../common/utils/styleUtils';
import { getFormattedTimer, getPropertyValue, getTimerByType } from '../viewUtils';

describe('getTimerByType()', () => {
  const clock = 10 * MILLIS_PER_HOUR;
  const timer = { current: -30 * MILLIS_PER_SECOND, elapsed: 5 * MILLIS_PER_MINUTE };

  it('shows the source matching the event timer type', () => {
    expect(getTimerByType(false, TimerType.CountDown, clock, timer)).toBe(timer.current);
    expect(getTimerByType(false, TimerType.CountUp, clock, timer)).toBe(timer.elapsed);
    expect(getTimerByType(false, TimerType.Clock, clock, timer)).toBe(clock);
    expect(getTimerByType(false, TimerType.None, clock, timer)).toBeNull();
  });

  it('lets a view override the event timer type', () => {
    expect(getTimerByType(false, TimerType.CountDown, clock, timer, TimerType.Clock)).toBe(clock);
  });

  it('holds a countdown at zero instead of counting into overtime when freezeEnd is set', () => {
    expect(getTimerByType(true, TimerType.CountDown, clock, timer)).toBe(0);
  });

  it('shows nothing for a countdown without a running timer', () => {
    expect(getTimerByType(false, TimerType.CountDown, clock, { current: null, elapsed: null })).toBeNull();
  });
});

describe('getFormattedTimer()', () => {
  const full = { removeSeconds: false, removeLeadingZero: false };
  const minutesOnly = { removeSeconds: true, removeLeadingZero: true };

  it('shows a placeholder when there is no timer to show', () => {
    expect(getFormattedTimer(null, TimerType.CountDown, 'min', full)).toBe(timerPlaceholder);
    expect(getFormattedTimer(1000, TimerType.None, 'min', minutesOnly)).toBe(timerPlaceholderMin);
  });

  it('shows overtime as a negative countdown', () => {
    expect(getFormattedTimer(-90 * MILLIS_PER_SECOND, TimerType.CountDown, 'min', full)).toBe('-00:01:30');
  });

  it('labels short durations with localised minutes when seconds are hidden', () => {
    expect(getFormattedTimer(5 * MILLIS_PER_MINUTE, TimerType.CountDown, 'min', minutesOnly)).toBe('5 min');
  });

  it('rounds overtime away from zero when seconds are hidden', () => {
    // 10 seconds over must not read as "0 min"
    expect(getFormattedTimer(-10 * MILLIS_PER_SECOND, TimerType.CountDown, 'min', minutesOnly)).toBe('-1 min');
  });
});

describe('getPropertyValue()', () => {
  const event = {
    title: 'Keynote',
    parent: 'group',
    custom: { speaker: 'Alex' },
  } as unknown as OntimeEvent;
  const entries = { group: { title: 'Morning' } as OntimeGroup } as unknown as RundownEntries;

  it('reads event fields, custom fields and the parent group title', () => {
    expect(getPropertyValue(event, 'title')).toBe('Keynote');
    expect(getPropertyValue(event, 'custom-speaker')).toBe('Alex');
    expect(getPropertyValue(event, 'parent', entries)).toBe('Morning');
  });

  it('shows nothing when the source is disabled or missing', () => {
    expect(getPropertyValue(event, 'none')).toBeUndefined();
    expect(getPropertyValue(null, 'title')).toBeUndefined();
    expect(getPropertyValue(event, 'parent')).toBeUndefined();
  });
});
