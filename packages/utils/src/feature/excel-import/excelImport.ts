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
  user0: 'user0',
  user1: 'user1',
  user2: 'user2',
  user3: 'user3',
  user4: 'user4',
  user5: 'user5',
  user6: 'user6',
  user7: 'user7',
  user8: 'user8',
  user9: 'user9',
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
