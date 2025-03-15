import { DatabaseModel, Settings, URLPreset } from 'ontime-types';

import { demoDb } from '../../../models/demoProject.js';
import { makeOntimeEvent, makeRundown } from '../../../services/rundown-service/__mocks__/rundown.mocks.js';

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
        publicInfo: 'new public info',
        backstageInfo: 'new backstage info',
      },
    } as Partial<DatabaseModel>);

    expect(mergedData.project).toStrictEqual({
      title: 'new title',
      description: 'Turin 2022',
      publicUrl: 'www.getontime.no',
      publicInfo: 'new public info',
      backstageUrl: 'www.github.com/cpvalente/ontime',
      backstageInfo: 'new backstage info',
      projectLogo: null,
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
      app: 'ontime',
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
        { enabled: true, alias: 'alias1', pathAndParams: '' },
        { enabled: true, alias: 'alias2', pathAndParams: '' },
      ] as URLPreset[],
    };

    const mergedData = safeMerge(demoDb, newData);

    expect(mergedData.urlPresets).toStrictEqual(newData.urlPresets);
  });

  it('merges customFields into existing object', () => {
    const existing = {
      customFields: {
        lighting: { type: 'string', label: 'lighting' },
        sound: { type: 'string', label: 'sound' },
      },
    };

    const newData = {
      customFields: {
        switcher: { type: 'string', label: 'switcher' },
        vfx: { type: 'string', label: 'vfx' },
      },
    };

    const expected = {
      switcher: { type: 'string', label: 'switcher' },
      vfx: { type: 'string', label: 'vfx' },
    };

    //@ts-expect-error -- testing partial merge
    const result = safeMerge(existing, newData);
    expect(result.customFields).toEqual(expected);
  });
});
