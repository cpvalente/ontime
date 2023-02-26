type FinishedTimeParams = {
  startedAt: number;
  duration: number;
  pausedTime: number;
  addedTime: number;
};

/**
 * Calculates expected finish time of a running timer
 */
export function getFinishTime(startedAt: number, duration: number, pausedTime: number, addedTime: number) {
  return Math.max(startedAt + duration + pausedTime + addedTime, startedAt);
}
