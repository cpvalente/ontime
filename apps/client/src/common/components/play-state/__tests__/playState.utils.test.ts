import { Playback, TimerPhase } from 'ontime-types';

import { getPlayState } from '../playState.utils';

describe('getPlayState()', () => {
  it.each([
    {
      playback: Playback.Play,
      phase: TimerPhase.Default,
      shape: 'filled',
      tone: 'play',
    },
    {
      playback: Playback.Pause,
      phase: TimerPhase.Default,
      shape: 'ring',
      tone: 'pause',
    },
    {
      playback: Playback.Roll,
      phase: TimerPhase.Default,
      shape: 'filled',
      tone: 'roll',
    },
    {
      playback: Playback.Roll,
      phase: TimerPhase.Pending,
      shape: 'ring',
      tone: 'roll',
    },
    {
      playback: Playback.Armed,
      phase: TimerPhase.Default,
      shape: 'faint',
      tone: undefined,
    },
    {
      playback: Playback.Stop,
      phase: TimerPhase.None,
      shape: 'faint',
      tone: undefined,
    },
  ])('shows a $shape mark for $playback, $phase', ({ playback, phase, shape, tone }) => {
    const state = getPlayState(playback, phase);
    expect(state.shape).toBe(shape);
    expect(state.tone).toBe(tone);
  });
});
