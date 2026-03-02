/**
 * Utility function checks whether a given event should be playing now
 */
export function checkIsNow(timeStart: number, timeEnd: number, clock: number): boolean {
  if (timeEnd < timeStart) {
    // overnight event: clock is either after start OR before end
    return clock >= timeStart || clock <= timeEnd;
  }
  return timeStart <= clock && clock <= timeEnd;
}
