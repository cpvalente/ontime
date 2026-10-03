import { Playback, TimerPhase } from 'ontime-types';
import { describe, expect, it } from 'vitest';

import { setPlayback } from '../../../../common/hooks/useSocket';
import { PlaybackControlInput, getPlaybackControlState } from '../playbackControl.utils';

function stateFor(overrides: Partial<PlaybackControlInput>) {
  return getPlaybackControlState({
    playback: Playback.Stop,
    numEvents: 3,
    selectedEventIndex: null,
    timerPhase: TimerPhase.None,
    ...overrides,
  });
}

describe('getPlaybackControlState()', () => {
  describe('Go button', () => {
    it('starts the first event when nothing is loaded', () => {
      const { goLabel, goAction } = stateFor({ playback: Playback.Stop, selectedEventIndex: null });
      expect(goLabel).toBe('Start');
      expect(goAction).toBe(setPlayback.startNext);
    });

    it('starts the loaded event when armed', () => {
      const { goLabel, goAction } = stateFor({ playback: Playback.Armed, selectedEventIndex: 2 });
      expect(goLabel).toBe('Start');
      expect(goAction).toBe(setPlayback.start);
    });

    it('moves to the next event while running', () => {
      const { goLabel, goAction } = stateFor({ playback: Playback.Play, selectedEventIndex: 0 });
      expect(goLabel).toBe('Next');
      expect(goAction).toBe(setPlayback.startNext);
    });

    it('finishes the show from the last event', () => {
      const { goLabel, goAction } = stateFor({ playback: Playback.Play, selectedEventIndex: 2 });
      expect(goLabel).toBe('Finish');
      expect(goAction).toBe(setPlayback.stop);
    });
  });

  it('locks manual navigation while rolling', () => {
    const state = stateFor({ playback: Playback.Roll, selectedEventIndex: 1, timerPhase: TimerPhase.Default });
    expect(state).toMatchObject({ disableGo: true, disableNext: true, disablePrev: true, disableRoll: true });
  });

  it('prevents going past either end of the rundown', () => {
    expect(stateFor({ playback: Playback.Play, selectedEventIndex: 0 })).toMatchObject({
      disablePrev: true,
      disableNext: false,
    });
    expect(stateFor({ playback: Playback.Play, selectedEventIndex: 2 })).toMatchObject({
      disablePrev: false,
      disableNext: true,
    });
  });

  it('disables show controls on an empty rundown', () => {
    const state = stateFor({ numEvents: 0 });
    expect(state).toMatchObject({ disableGo: true, disableNext: true, disablePrev: true, disableRoll: true });
  });

  it('only allows adding time to a running or paused timer', () => {
    expect(stateFor({ playback: Playback.Play, selectedEventIndex: 0 }).disableAddTime).toBe(false);
    expect(stateFor({ playback: Playback.Pause, selectedEventIndex: 0 }).disableAddTime).toBe(false);
    expect(stateFor({ playback: Playback.Armed, selectedEventIndex: 0 }).disableAddTime).toBe(true);
    expect(stateFor({ playback: Playback.Roll, selectedEventIndex: 0 }).disableAddTime).toBe(true);
    expect(stateFor({ playback: Playback.Stop }).disableAddTime).toBe(true);
  });
});
