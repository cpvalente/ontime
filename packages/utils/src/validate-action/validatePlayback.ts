import { Playback } from 'ontime-types';

export function validatePlayback(currentPlayback: Playback) {
  return {
    start: currentPlayback !== Playback.Stop,
    pause: currentPlayback === Playback.Play || currentPlayback === Playback.Roll,
    roll: true,
    stop: currentPlayback !== Playback.Stop,
  };
}
