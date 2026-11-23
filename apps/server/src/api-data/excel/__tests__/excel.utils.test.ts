import { CustomFields } from 'ontime-types';
import { ImportMap, defaultImportMap } from 'ontime-utils';

import { demoDb } from '../../../models/demoProject.js';
import { getCustomFieldData, rundownToTabular } from '../excel.utils.js';

describe('getCustomFieldData()', () => {
  it('generates a list of keys from the given import map', () => {
    const importMap: ImportMap = {
      worksheet: 'event schedule',
      timeStart: 'time start',
      linkStart: 'link start',
      timeEnd: 'time end',
      duration: 'duration',
      flag: 'flag',
      cue: 'cue',
      title: 'title',
      countToEnd: 'count to end',
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
      id: 'id',
    };

    const result = getCustomFieldData(importMap, []);
    expect(result.mergedCustomFields).toStrictEqual([
      { key: 'lighting', type: 'text', colour: '', label: 'lighting' },
      { key: 'sound', type: 'text', colour: '', label: 'sound' },
      { key: 'video', type: 'text', colour: '', label: 'video' },
    ]);

    // it is an inverted record of <importKey, ontimeKey>
    expect(result.customFieldImportKeys).toStrictEqual({
      lx: 'lighting',
      sound: 'sound',
      av: 'video',
    });
  });

  it('keeps colour information from existing fields', () => {
    const importMap: ImportMap = {
      worksheet: 'event schedule',
      timeStart: 'time start',
      linkStart: 'link start',
      timeEnd: 'time end',
      duration: 'duration',
      flag: 'flag',
      cue: 'cue',
      title: 'title',
      countToEnd: 'count to end',
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
        'ontime key': 'excel label',
      },
      id: 'id',
    };

    const existingCustomFields: CustomFields = [
      { key: 'lighting', label: 'lighting', type: 'text', colour: 'red' },
      { key: 'sound', label: 'sound', type: 'text', colour: 'green' },
      { key: 'ontime_key', label: 'ontime key', type: 'text', colour: 'blue' },
    ];

    const result = getCustomFieldData(importMap, existingCustomFields);
    expect(result.mergedCustomFields).toStrictEqual([
      { key: 'lighting', type: 'text', colour: 'red', label: 'lighting' },
      { key: 'sound', type: 'text', colour: 'green', label: 'sound' },
      { key: 'video', type: 'text', colour: '', label: 'video' },
      { key: 'ontime_key', type: 'text', colour: 'blue', label: 'ontime key' },
    ]);

    // it is an inverted record of <importKey, ontimeKey>
    expect(result.customFieldImportKeys).toStrictEqual({
      lx: 'lighting',
      sound: 'sound',
      av: 'video',
      'excel label': 'ontime_key',
    });
  });

  it('lowercases the keys in the import map', () => {
    const importMap: ImportMap = {
      ...defaultImportMap,
      custom: {
        Lighting: 'Lx',
        Sound: 'sound',
        video: 'av',
      },
    };

    const result = getCustomFieldData(importMap, []);
    expect(result.mergedCustomFields).toStrictEqual([
      { key: 'Lighting', type: 'text', colour: '', label: 'Lighting' },
      { key: 'Sound', type: 'text', colour: '', label: 'Sound' },
      { key: 'video', type: 'text', colour: '', label: 'video' },
    ]);

    // notice that the keys excel keys are lowercased
    expect(result.customFieldImportKeys).toStrictEqual({
      lx: 'Lighting',
      sound: 'Sound',
      av: 'video',
    });
  });
});

describe('rundownToTabular()', () => {
  it('returns an array of arrays describing a rundown', () => {
    const testRundown = demoDb.rundowns['default'];
    const result = rundownToTabular(testRundown, demoDb.customFields);
    expect(result).toMatchSnapshot();
  });

  it('writes the custom field columns in the project order, numeric keys included', () => {
    const testRundown = demoDb.rundowns['default'];
    const customFields: CustomFields = [
      { key: 'Notes', label: 'Notes', type: 'text', colour: '' },
      { key: '2', label: '2', type: 'text', colour: '' },
    ];

    const [header] = rundownToTabular(testRundown, customFields);
    expect(header.slice(-2)).toEqual(['Notes', '2']);
  });
});
