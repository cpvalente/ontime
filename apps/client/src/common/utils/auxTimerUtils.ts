export function getAuxTimerLabel(name: string | undefined, fallback: string): string {
  const custom = name?.trim();
  return custom ? custom : fallback;
}

/** Combines the aux timer's index with its custom name, eg. "Aux 1: Speaker" */
export function getAuxTimerIndexedLabel(name: string | undefined, index: number): string {
  const custom = name?.trim();
  return custom ? `Aux ${index}: ${custom}` : `Aux ${index}`;
}
