import { Playback, TimerPhase } from 'ontime-types';

export type PlayState = {
  shape: 'filled' | 'ring' | 'faint';
  tone?: 'play' | 'pause' | 'roll';
  label: string;
};

/** shape carries the play state, so it reads without colour */
export function getPlayState(playback: Playback, phase: TimerPhase): PlayState {
  if (phase === TimerPhase.Pending) return { shape: 'ring', tone: 'roll', label: 'Roll: waiting to start' };
  if (playback === Playback.Play) return { shape: 'filled', tone: 'play', label: 'Running' };
  if (playback === Playback.Pause) return { shape: 'ring', tone: 'pause', label: 'Paused' };
  if (playback === Playback.Roll) return { shape: 'filled', tone: 'roll', label: 'Roll mode' };
  if (playback === Playback.Armed) return { shape: 'faint', label: 'Loaded' };
  return { shape: 'faint', label: 'Stopped' };
}
