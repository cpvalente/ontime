import { MaybeNumber, Playback } from 'ontime-types';

/**
 * Whether the current time is in overtime
 */
export function isOvertime(current: MaybeNumber): boolean {
  return (current ?? 0) < 0;
}

/**
 * Whether the progress bar should be shown
 */
export function getShowProgressBar(playback: Playback): boolean {
  return playback !== Playback.Stop;
}
