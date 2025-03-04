//TODO: handle delays..?

/**
 *
 * @param normalisedTimeStart the start time of the event including the day offset to the currently loaded event
 * @param totalGap accumulated gap of the entire rundown up to this point
 * @param isLinkedAndNext is this the imidialy next event and start linked
 * @param clock wall clock
 * @param offset runtime offset
 * @returns
 */
export function calculateTimeUntilStart(
  normalisedTimeStart: number,
  totalGap: number,
  isLinkedAndNext: boolean,
  clock: number,
  offset: number,
) {
  const consumedOffset = isLinkedAndNext ? offset : Math.min(offset + totalGap, 0);
  const offsetTimestart = normalisedTimeStart - consumedOffset;
  const timeUntil = offsetTimestart - clock;
  return timeUntil;
}

/**
 * for refrencce
 * 
 * export function getTimeToStart(now: number, start: number, delay: number, offset: number): number {
    return start + delay - now - offset;
  }
 * 
 * 
 */
