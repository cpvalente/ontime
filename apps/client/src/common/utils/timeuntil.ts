//TODO: handle delays..?
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
