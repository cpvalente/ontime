import { TimerPhase, TimerType } from 'ontime-types';

import { getEventTimerSecondary, shouldPlayEndSound } from '../timer.utils';

describe('getEventTimerSecondary()', () => {
  it('formats the event countdown as a labelled secondary value', () => {
    expect(
      getEventTimerSecondary({ current: 65_000, elapsed: 5_000 }, TimerType.CountDown, 0, 'min', false, false),
    ).toBe('Event timer 00:01:05');
  });

  it('preserves the event count-up display', () => {
    expect(getEventTimerSecondary({ current: 55_000, elapsed: 5_000 }, TimerType.CountUp, 0, 'min', false, false)).toBe(
      'Event timer 00:00:05',
    );
  });

  it('falls back to remaining time when the event timer is hidden', () => {
    expect(getEventTimerSecondary({ current: 5_000, elapsed: 55_000 }, TimerType.None, 0, 'min', false, false)).toBe(
      'Event timer 00:00:05',
    );
  });

  it('shows event progress instead of wall-clock time for clock events', () => {
    expect(
      getEventTimerSecondary({ current: 5_000, elapsed: 55_000 }, TimerType.Clock, 12_000, 'min', false, false),
    ).toBe('Event timer 00:00:05');
  });
});

describe('shouldPlayEndSound()', () => {
  test.each([TimerPhase.Default, TimerPhase.Warning, TimerPhase.Danger])(
    'sounds when a running timer goes into overtime from %s',
    (previousPhase) => {
      expect(shouldPlayEndSound(previousPhase, TimerPhase.Overtime)).toBe(true);
    },
  );

  it('stays silent on the first phase we see, a client could be joining mid-overtime', () => {
    expect(shouldPlayEndSound(null, TimerPhase.Overtime)).toBe(false);
  });

  it('stays silent when the phase was reset, a reload during overtime starts from none', () => {
    expect(shouldPlayEndSound(TimerPhase.None, TimerPhase.Overtime)).toBe(false);
  });

  it('stays silent for a roll timer waiting to start', () => {
    expect(shouldPlayEndSound(TimerPhase.Pending, TimerPhase.Overtime)).toBe(false);
  });

  it('sounds once, not on every update while in overtime', () => {
    expect(shouldPlayEndSound(TimerPhase.Overtime, TimerPhase.Overtime)).toBe(false);
  });

  it('stays silent on phases which are not the end of the timer', () => {
    expect(shouldPlayEndSound(TimerPhase.Default, TimerPhase.Warning)).toBe(false);
    expect(shouldPlayEndSound(TimerPhase.Warning, TimerPhase.Danger)).toBe(false);
    expect(shouldPlayEndSound(TimerPhase.Overtime, TimerPhase.None)).toBe(false);
  });
});
