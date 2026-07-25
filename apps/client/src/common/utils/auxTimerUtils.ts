/**
 * Resolves the display label for an aux timer.
 * Falls back to the provided default when no custom name is set.
 * @param name - the aux timer's custom name (from the runtime store)
 * @param fallback - label to use when no custom name is set
 */
export function getAuxTimerLabel(name: string | undefined, fallback: string): string {
  const custom = name?.trim();
  return custom ? custom : fallback;
}
