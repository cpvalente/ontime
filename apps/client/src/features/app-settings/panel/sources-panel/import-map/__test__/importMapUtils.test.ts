import { ImportMap } from 'ontime-utils';

import { type TableEntry, makeImportMap, makeImportPreview } from '../importMapUtils';

describe('makeImportPreview()', () => {
  it('generates preview objects from import map', () => {
    const testImportMap: ImportMap = {
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
      custom: {
        lighting: 'lx',
        sound: 'sound',
        video: 'av',
      },
    };
    const { ontimeFields, customFields } = makeImportPreview(testImportMap);

    expect(ontimeFields.length).toBe(16);
    expect(customFields.length).toBe(3);
    expect(customFields).toStrictEqual([
      { label: 'lighting', ontimeName: 'lighting', importName: 'lx' },
      { label: 'sound', ontimeName: 'sound', importName: 'sound' },
      { label: 'video', ontimeName: 'video', importName: 'av' },
    ]);
  });
});

describe('makeImportMap()', () => {
  it('generates an import map from a list of TableEntries', () => {
    const testEntries: TableEntry[] = [
      {
        label: 'Worksheet',
        ontimeName: 'worksheet',
        importName: 'event schedule',
      },
      {
        label: 'Start time',
        ontimeName: 'timeStart',
        importName: 'time start',
      },
      {
        label: 'End Time',
        ontimeName: 'timeEnd',
        importName: 'time end',
      },
      {
        label: 'Duration',
        ontimeName: 'duration',
        importName: 'duration',
      },
      {
        label: 'Warning Time',
        ontimeName: 'timeWarning',
        importName: 'warning time',
      },
      {
        label: 'Danger Time',
        ontimeName: 'timeDanger',
        importName: 'danger time',
      },
      {
        label: 'Cue',
        ontimeName: 'cue',
        importName: 'cue',
      },
      {
        label: 'Colour',
        ontimeName: 'colour',
        importName: 'colour',
      },
      {
        label: 'Title',
        ontimeName: 'title',
        importName: 'title',
      },
      {
        label: 'Presenter',
        ontimeName: 'presenter',
        importName: 'presenter',
      },
      {
        label: 'Subtitle',
        ontimeName: 'subtitle',
        importName: 'subtitle',
      },
      {
        label: 'Note',
        ontimeName: 'note',
        importName: 'notes',
      },
      {
        label: 'Is Public',
        ontimeName: 'isPublic',
        importName: 'public',
      },
      {
        label: 'Skip',
        ontimeName: 'skip',
        importName: 'skip',
      },
      {
        label: 'Timer Type',
        ontimeName: 'timerType',
        importName: 'timer type',
      },
      {
        label: 'End Action',
        ontimeName: 'endAction',
        importName: 'end action',
      },
      [
        {
          label: 'lighting',
          ontimeName: 'lighting',
          importName: 'lx',
        },
        {
          label: 'sound',
          ontimeName: 'sound',
          importName: 'sound',
        },
        {
          label: 'video',
          ontimeName: 'video',
          importName: 'av',
        },
      ],
    ];

    const importMap = makeImportMap(testEntries);
    expect(importMap.custom).toStrictEqual({
      lighting: 'lx',
      sound: 'sound',
      video: 'av',
    });
    expect(importMap).toMatchSnapshot();
  });
});
