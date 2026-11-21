import { Playback, TimerPhase } from 'ontime-types';

export type PreviewState = 'blackout' | 'overtime' | 'paused' | 'waiting' | 'onAir' | 'armed' | 'stopped';

export function getPreviewState(playback: Playback, phase: TimerPhase, blackout: boolean): PreviewState {
  if (blackout) return 'blackout';
  if (phase === TimerPhase.Overtime) return 'overtime';
  if (playback === Playback.Pause) return 'paused';
  // roll holds here until the next start time
  if (phase === TimerPhase.Pending) return 'waiting';
  if (playback === Playback.Play || playback === Playback.Roll) return 'onAir';
  if (playback === Playback.Armed) return 'armed';
  return 'stopped';
}
