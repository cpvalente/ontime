/** The timer's name, falling back to its index when unnamed, eg. "Aux 1" */
export function getAuxTimerLabel(name: string | undefined, index: number): string {
  return name?.trim() || `Aux ${index}`;
}

/** Keeps the aux timer identifiable by index while showing its name, eg. "Aux 1: Speaker" */
export function getAuxTimerIndexedLabel(name: string | undefined, index: number): string {
  const custom = name?.trim();
  return custom ? `Aux ${index}: ${custom}` : `Aux ${index}`;
}
