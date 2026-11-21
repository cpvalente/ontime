import { Playback, TimerPhase } from 'ontime-types';

import { getPreviewState } from '../timerPreview.utils';

describe('getPreviewState()', () => {
  it.each([
    { playback: Playback.Play, phase: TimerPhase.Default, blackout: false, expected: 'onAir' },
    { playback: Playback.Roll, phase: TimerPhase.Default, blackout: false, expected: 'onAir' },
    { playback: Playback.Pause, phase: TimerPhase.Default, blackout: false, expected: 'paused' },
    { playback: Playback.Stop, phase: TimerPhase.None, blackout: false, expected: 'stopped' },
    { playback: Playback.Armed, phase: TimerPhase.Default, blackout: false, expected: 'armed' },
    { playback: Playback.Roll, phase: TimerPhase.Pending, blackout: false, expected: 'waiting' },
    { playback: Playback.Pause, phase: TimerPhase.Overtime, blackout: false, expected: 'overtime' },
    { playback: Playback.Play, phase: TimerPhase.Overtime, blackout: true, expected: 'blackout' },
  ])('shows $expected for $playback, $phase, blackout $blackout', ({ playback, phase, blackout, expected }) => {
    expect(getPreviewState(playback, phase, blackout)).toBe(expected);
  });
});
