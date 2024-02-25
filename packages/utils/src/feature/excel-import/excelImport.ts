export type ExcelImportOptions = keyof typeof defaultExcelImportMap;
export type ExcelImportMap = typeof defaultExcelImportMap;

export const defaultExcelImportMap = {
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
};

export function isExcelImportMap(obj: unknown): obj is ExcelImportMap {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const keys = Object.keys(defaultExcelImportMap);
  return keys.every((key) => Object.hasOwn(obj, key));
}
