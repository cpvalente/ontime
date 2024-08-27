import { Playback, TimerPhase } from 'ontime-types';

/**
 * Simple rules to determine whether a playback action is valid
 */
export function validatePlayback(currentPlayback: Playback, timerPhase: TimerPhase) {
  return {
    start: currentPlayback !== Playback.Stop && currentPlayback !== Playback.Play,
    pause: currentPlayback === Playback.Play,
    roll: currentPlayback !== Playback.Roll && timerPhase !== TimerPhase.Overtime,
    stop: currentPlayback !== Playback.Stop,
    reload: currentPlayback !== Playback.Stop && currentPlayback !== Playback.Roll,
  };
}
