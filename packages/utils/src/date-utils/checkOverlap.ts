/**
 * Check if two Ontime events overlap
 * @link https://stackoverflow.com/questions/3269434/whats-the-most-efficient-way-to-test-if-two-ranges-overlap
 * We use the deconstructed times to facilitate implementation in UI
 */
export function checkOverlap(
  previousStart: number,
  previousEnd: number,
  currentStart: number,
  currentEnd: number,
): boolean {
  // deal with simple case where the event is later
  if (currentStart >= previousEnd) {
    return false;
  }

  // at this point we know there may be an overlap
  return Math.max(previousStart, currentStart) - Math.min(previousEnd, currentEnd) <= 0;
}
