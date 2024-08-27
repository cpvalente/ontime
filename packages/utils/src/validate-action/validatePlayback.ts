import { Playback } from 'ontime-types';

/**
 * Simple rules to determine whether a playback action is valid
 */
export function validatePlayback(currentPlayback: Playback) {
  return {
    start: currentPlayback !== Playback.Stop && currentPlayback !== Playback.Play,
    pause: currentPlayback === Playback.Play,
    roll: currentPlayback !== Playback.Roll,
    stop: currentPlayback !== Playback.Stop,
    reload: currentPlayback !== Playback.Stop && currentPlayback !== Playback.Roll,
  };
}
