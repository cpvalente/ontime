type MaybeNumber = number | null;

/**
 * Calculates expected finish time of a running timer
 */
export function getFinishTime(startedAt: MaybeNumber, duration: MaybeNumber, pausedTime: number, addedTime: number) {
  return Math.max(startedAt + duration + pausedTime + addedTime, startedAt);
}

/**
 * Calculates running countdown
 */
export function getCurrentTime(expectedFinish: number, pausedTime: number, addedTime: number, clock: number) {
  return expectedFinish + addedTime + pausedTime - clock;
}

/**
 * Calculates elapsed time
 */
export function getElapsed(startedAt: number, clock: number) {
  if (startedAt > clock) {
    throw new Error('clock cannot be higher than startedAt');
  }
  return clock - startedAt;
}
