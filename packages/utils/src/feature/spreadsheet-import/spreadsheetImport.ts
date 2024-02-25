export type ImportOptions = keyof typeof defaultImportMap | 'custom';
export type ImportMap = typeof defaultImportMap & { custom: Record<string, string> };

export const defaultImportMap = {
  worksheet: 'event schedule',
  timeStart: 'time start',
  timeEnd: 'time end',
  duration: 'duration',
  cue: 'cue',
  title: 'title',
  presenter: 'presenter',
  subtitle: 'subtitle',
  isPublic: 'public',
  skip: 'skip',
  note: 'notes',
  colour: 'colour',
  endAction: 'end action',
  timerType: 'timer type',
  timeWarning: 'warning time',
  timeDanger: 'danger time',
  custom: {},
};

/**
 * Validates whether an object is an Import Map
 * @param obj
 */
export function isImportMap(obj: unknown): obj is ImportMap {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const keys = Object.keys(defaultImportMap);
  return keys.every((key) => Object.hasOwn(obj, key));
}
