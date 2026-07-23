/**
 * Resolves the display label for an aux timer.
 * Falls back to the provided default when no custom name is set.
 * @param names - the auxTimerNames array from settings (indexed 0-based)
 * @param index - 1-based aux timer index (1, 2, 3)
 * @param fallback - label to use when no custom name is set
 */
export function getAuxTimerLabel(names: string[] | undefined, index: number, fallback: string): string {
  const custom = names?.[index - 1]?.trim();
  return custom ? custom : fallback;
}
