import { Playback } from 'ontime-types';

/**
 * Utility checks whether the playback is considered to be active
 * @param state
 * @returns
 */
export function isPlaybackActive(state: Playback): boolean {
  return state === Playback.Play || state === Playback.Pause || state === Playback.Roll;
}
