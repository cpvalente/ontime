import { defaultImportMap, ImportMap } from 'ontime-utils';

export type TableEntry = { label: string; ontimeName: keyof ImportMap | string; importName: string };

function makeOntimeFields(importOptions: ImportMap): TableEntry[] {
  return [
    { label: 'Worksheet', ontimeName: 'worksheet', importName: importOptions.worksheet },
    { label: 'Start time', ontimeName: 'timeStart', importName: importOptions.timeStart },
    { label: 'End Time', ontimeName: 'timeEnd', importName: importOptions.timeEnd },
    { label: 'Duration', ontimeName: 'duration', importName: importOptions.duration },
    { label: 'Warning Time', ontimeName: 'timeWarning', importName: importOptions.timeWarning },
    { label: 'Danger Time', ontimeName: 'timeDanger', importName: importOptions.timeDanger },
    { label: 'Cue', ontimeName: 'cue', importName: importOptions.cue },
    { label: 'Colour', ontimeName: 'colour', importName: importOptions.colour },
    { label: 'Title', ontimeName: 'title', importName: importOptions.title },
    { label: 'Presenter', ontimeName: 'presenter', importName: importOptions.presenter },
    { label: 'Subtitle', ontimeName: 'subtitle', importName: importOptions.subtitle },
    { label: 'Note', ontimeName: 'note', importName: importOptions.note },
    { label: 'Is Public', ontimeName: 'isPublic', importName: importOptions.isPublic },
    { label: 'Skip', ontimeName: 'skip', importName: importOptions.skip },
    { label: 'Timer Type', ontimeName: 'timerType', importName: importOptions.timerType },
    { label: 'End Action', ontimeName: 'endAction', importName: importOptions.endAction },
  ];
}

function makeCustomFields(importOptions: ImportMap): TableEntry[] {
  const customFieldsImportMap: TableEntry[] = [];
  if (Object.hasOwn(importOptions, 'custom')) {
    for (const field in importOptions.custom) {
      const importName = importOptions.custom[field];
      customFieldsImportMap.push({ label: field, ontimeName: field, importName });
    }
  }
  return customFieldsImportMap;
}

export function makeImportPreview(importOptions: ImportMap) {
  const ontimeFields = makeOntimeFields(importOptions);
  const customFields = makeCustomFields(importOptions);
  return { ontimeFields, customFields };
}

export function makeImportMap(entries: TableEntry[]) {
  const importMap: ImportMap = { ...defaultImportMap };
  for (const entry of entries) {
    if (Array.isArray(entry)) {
      for (const customEntry of entry) {
        importMap.custom[customEntry.ontimeName] = customEntry.importName;
      }
    } else {
      // @ts-expect-error -- its ok
      importMap[entry.ontimeName] = entry.importName;
    }
  }
  return importMap;
}
