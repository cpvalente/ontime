type MaybeNumber = number | null;

/**
 * Calculates expected finish time of a running timer
 */
export function getExpectedFinish(
  startedAt: MaybeNumber,
  finishedAt: MaybeNumber,
  duration: number,
  pausedTime: number,
  addedTime: number,
) {
  if (startedAt === null) {
    return null;
  }

  if (finishedAt !== null) {
    return finishedAt;
  }

  return Math.max(startedAt + duration + pausedTime + addedTime, startedAt);
}

/**
 * Calculates running countdown
 */
export function getCurrent(
  startedAt: MaybeNumber,
  duration: number,
  addedTime: number,
  pausedTime: number,
  clock: number,
) {
  if (startedAt === null) {
    return null;
  }
  return startedAt + duration + addedTime + pausedTime - clock;
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
