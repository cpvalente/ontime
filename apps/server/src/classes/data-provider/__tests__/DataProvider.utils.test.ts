import { DatabaseModel, Settings, URLPreset } from 'ontime-types';

import { demoDb } from '../../../models/demoProject.js';
import { makeOntimeEvent, makeRundown } from '../../../api-data/rundown/__mocks__/rundown.mocks.js';

import { safeMerge } from '../DataProvider.utils.js';

describe('safeMerge', () => {
  it('returns existing data if new data is not provided', () => {
    const mergedData = safeMerge(demoDb, {});
    expect(mergedData).toEqual(demoDb);
  });

  it('overrides a rundown with the same key', () => {
    const newData = makeRundown({
      id: 'demo',
      entries: {
        '1': makeOntimeEvent({ id: '1', title: 'new title' }),
        '2': makeOntimeEvent({ id: '1', title: 'new title' }),
      },
      order: ['1', '2'],
    });
    const mergedData = safeMerge(demoDb, { rundowns: { demo: newData } });
    expect(mergedData.rundowns.demo).toStrictEqual(newData);
  });

  it('merges a rundown with a new key', () => {
    const newData = makeRundown({
      id: 'rundown',
      entries: {
        '1': makeOntimeEvent({ id: '1', title: 'new title' }),
        '2': makeOntimeEvent({ id: '1', title: 'new title' }),
      },
      order: ['1', '2'],
    });
    const mergedData = safeMerge(demoDb, { rundowns: { rundown: newData } });
    expect(mergedData.rundowns.demo).toStrictEqual(demoDb.rundowns.demo);
    expect(mergedData.rundowns.rundown).toStrictEqual(newData);
  });

  it('merges the project key', () => {
    const mergedData = safeMerge(demoDb, {
      project: {
        title: 'new title',
        info: 'new backstage info',
        custom: [
          {
            title: 'new custom title',
            value: 'new custom value',
          },
        ],
      },
    } as Partial<DatabaseModel>);

    expect(mergedData.project).toStrictEqual({
      title: 'new title',
      description: 'Turin 2022',
      url: 'www.github.com/cpvalente/ontime',
      info: 'new backstage info',
      logo: null,
      custom: [
        {
          title: 'new custom title',
          value: 'new custom value',
        },
      ],
    });
  });

  it('merges the settings key', () => {
    const mergedData = safeMerge(demoDb, {
      settings: {
        serverPort: 3000,
        language: 'pt',
        version: 'new',
      } as Settings,
    });
    expect(mergedData.settings).toStrictEqual({
      version: 'new',
      serverPort: 3000,
      operatorKey: null,
      editorKey: null,
      timeFormat: '24',
      language: 'pt',
    });
  });

  it('should merge the urlPresets key when present', () => {
    const newData = {
      urlPresets: [
        { enabled: true, alias: 'alias1', search: '' },
        { enabled: true, alias: 'alias2', search: '' },
      ] as URLPreset[],
    };

    const mergedData = safeMerge(demoDb, newData);

    expect(mergedData.urlPresets).toStrictEqual(newData.urlPresets);
  });

  it('merges customFields into existing object', () => {
    const existing = {
      customFields: {
        lighting: { type: 'text', label: 'lighting' },
        sound: { type: 'text', label: 'sound' },
      },
    };

    const newData = {
      customFields: {
        switcher: { type: 'text', label: 'switcher' },
        vfx: { type: 'text', label: 'vfx' },
      },
    };

    const expected = {
      switcher: { type: 'text', label: 'switcher' },
      vfx: { type: 'text', label: 'vfx' },
    };

    //@ts-expect-error -- testing partial merge
    const result = safeMerge(existing, newData);
    expect(result.customFields).toEqual(expected);
  });
});
