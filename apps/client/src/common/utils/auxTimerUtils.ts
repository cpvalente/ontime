export function getAuxTimerLabel(name: string | undefined, fallback: string): string {
  const custom = name?.trim();
  return custom ? custom : fallback;
}
