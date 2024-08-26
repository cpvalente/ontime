/**
 * Utility function checks whether a given event is the day after from its predecessor
 * We consider an event to be the day after, if it begins before the start of the previous
 * @example day after
 * 09:00 - 10:00
 * 08:00 - 10:30
 * @example same day
 * 09:00 - 10:00
 * 09:30 - 10:30
 */
export function checkIsNextDay(previousStart: number, timeStart: number, previousDuration: number): boolean {
  return previousDuration === 0 ? false : timeStart <= previousStart;
}
