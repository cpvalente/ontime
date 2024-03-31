import { ImportCustom } from 'ontime-utils';

import { convertToImportMap } from '../importMapUtils';

describe('convertToImportMap', () => {
  it('converts a namedImportMap to a importMap', () => {
    const defaultNamedImporMap = {
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
      custom: [
        { ontimeName: 'Custom1        ', importName: 'custom1' },
        { ontimeName: 'Custom2', importName: 'custom2' },
        { ontimeName: 'Custom3', importName: 'custom3' },
        { ontimeName: 'EmptyImportName', importName: '' },
        { ontimeName: '', importName: 'EmptyOntimeName' },
      ] as ImportCustom[],
    };

    const importMap = convertToImportMap(defaultNamedImporMap);
    expect(importMap.custom).toStrictEqual({
      Custom1: 'custom1',
      Custom2: 'custom2',
      Custom3: 'custom3',
    });
  });
});
