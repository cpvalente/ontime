import { ImportMap } from 'ontime-utils';

import { makeImportPreview } from '../importMapUtils';

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
