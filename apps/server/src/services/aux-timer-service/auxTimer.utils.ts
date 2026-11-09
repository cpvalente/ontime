import { MaybeNumber, SimpleDirection, SimplePlayback, SimpleTimerState } from 'ontime-types';

/**
 * An aux timer, its current value is derived from it at any instant
 * It is also what a restore point saves
 */
export type AuxTimer = {
  playback: SimplePlayback;
  direction: SimpleDirection;
  /** the time set by the user, which a stop returns to */
  duration: number;
  /** the value it counts from, or shows when not running */
  value: number;
  /** the instant it started counting from value, only while running */
  startedAt: MaybeNumber;
};

export type AuxTimers = [AuxTimer, AuxTimer, AuxTimer];

export function createAuxTimer(duration: number): AuxTimer {
  return {
    playback: SimplePlayback.Stop,
    direction: SimpleDirection.CountDown,
    duration,
    value: duration,
    startedAt: null,
  };
}

export function getCurrent(timer: AuxTimer, now: number): number {
  if (timer.startedAt === null) {
    return timer.value;
  }
  const elapsed = now - timer.startedAt;
  return timer.direction === SimpleDirection.CountDown ? timer.value - elapsed : timer.value + elapsed;
}

export function toTimerState(timer: AuxTimer, name: string, now: number): SimpleTimerState {
  return {
    duration: timer.duration,
    current: getCurrent(timer, now),
    playback: timer.playback,
    direction: timer.direction,
    name,
  };
}

export function start(timer: AuxTimer, now: number): AuxTimer {
  if (timer.playback === SimplePlayback.Start) {
    return timer;
  }
  return { ...timer, playback: SimplePlayback.Start, startedAt: now };
}

export function pause(timer: AuxTimer, now: number): AuxTimer {
  if (timer.playback !== SimplePlayback.Start) {
    return timer;
  }
  return { ...timer, playback: SimplePlayback.Pause, value: getCurrent(timer, now), startedAt: null };
}

export function stop(timer: AuxTimer): AuxTimer {
  return { ...timer, playback: SimplePlayback.Stop, value: timer.duration, startedAt: null };
}

/**
 * Sets the time, a running timer counts from it now
 */
export function setTime(timer: AuxTimer, duration: number, now: number): AuxTimer {
  const startedAt = timer.playback === SimplePlayback.Start ? now : null;
  return { ...timer, duration, value: duration, startedAt };
}

/**
 * Adds time to the current value, a stop still returns to the time set
 */
export function addTime(timer: AuxTimer, millis: number): AuxTimer {
  return { ...timer, value: timer.value + millis };
}

/**
 * Changes direction, a running timer counts from its current value in the new direction
 */
export function setDirection(timer: AuxTimer, direction: SimpleDirection, now: number): AuxTimer {
  if (timer.playback === SimplePlayback.Start) {
    return { ...timer, direction, value: getCurrent(timer, now), startedAt: now };
  }
  return { ...timer, direction };
}
