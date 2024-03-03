import { ImportCustom, ImportMap } from 'ontime-utils';

export type NamedImportMap = typeof namedImportMap;

// Record of label and import name
export const namedImportMap = {
  Worksheet: 'event schedule',
  Start: 'time start',
  End: 'time end',
  Duration: 'duration',
  Cue: 'cue',
  Title: 'title',
  'Is Public': 'public',
  Skip: 'skip',
  Note: 'notes',
  Colour: 'colour',
  'End action': 'end action',
  'Timer type': 'timer type',
  'Time warning': 'warning time',
  'Time danger': 'danger time',
  custom: [] as ImportCustom[],
};

export function convertToImportMap(namedImportMap: NamedImportMap): ImportMap {
  const custom = namedImportMap.custom.reduce((accumulator, { ontimeName, importName }) => {
    if (ontimeName && importName) {
      accumulator[ontimeName.trim()] = importName.trim();
    }
    return accumulator;
  }, {});

  return {
    worksheet: namedImportMap.Worksheet,
    timeStart: namedImportMap.Start,
    timeEnd: namedImportMap.End,
    duration: namedImportMap.Duration,
    cue: namedImportMap.Cue,
    title: namedImportMap.Title,
    isPublic: namedImportMap['Is Public'],
    skip: namedImportMap.Skip,
    note: namedImportMap.Note,
    colour: namedImportMap.Colour,
    endAction: namedImportMap['End action'],
    timerType: namedImportMap['Timer type'],
    timeWarning: namedImportMap['Time warning'],
    timeDanger: namedImportMap['Time danger'],
    custom,
  };
}

export function persistImportMap(options: NamedImportMap) {
  localStorage.setItem('ontime-import-options', JSON.stringify(options));
}

export function getPersistedOptions(): NamedImportMap {
  const options = localStorage.getItem('ontime-import-options');
  if (!options) {
    return namedImportMap;
  }
  return JSON.parse(options);
}
