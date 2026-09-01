import { TimerPhase } from 'ontime-types';

import { shouldPlayEndSound } from '../timer.utils';

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
