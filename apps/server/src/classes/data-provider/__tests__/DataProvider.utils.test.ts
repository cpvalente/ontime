import { DatabaseModel, OntimeRundown, Settings, URLPreset, ViewSettings } from 'ontime-types';
import { safeMerge } from '../DataProvider.utils.js';

describe('safeMerge', () => {
  const existing = {
    rundown: [],
    project: {
      title: 'existing title',
      description: 'existing description',
      publicUrl: 'existing public URL',
      backstageUrl: 'existing backstageUrl',
      publicInfo: 'existing backstageInfo',
      backstageInfo: 'existing backstageInfo',
      projectLogo: null,
    },
    settings: {
      app: 'ontime',
      version: '2.0.0',
      serverPort: 4001,
      editorKey: null,
      operatorKey: null,
      timeFormat: '24',
      language: 'en',
    },
    viewSettings: {
      overrideStyles: false,
      freezeEnd: false,
      endMessage: 'existing endMessage',
      normalColor: '#ffffffcc',
      warningColor: '#FFAB33',
      dangerColor: '#ED3333',
    },
    urlPresets: [],
    customFields: {
      lighting: { type: 'string', label: 'lighting', colour: 'red' },
      vfx: { type: 'string', label: 'vfx', colour: 'blue' },
    },
    osc: {
      portIn: 8888,
      portOut: 9999,
      targetIP: '127.0.0.1',
      enabledIn: false,
      enabledOut: false,
      subscriptions: [],
    },
    http: {
      enabledOut: false,
      subscriptions: [],
    },
  } as DatabaseModel;

  it('returns existing data if new data is not provided', () => {
    const mergedData = safeMerge(existing, {});
    expect(mergedData).toEqual(existing);
  });

  it('merges the rundown key', () => {
    const newData = {
      rundown: [{ title: 'item 1' }, { title: 'item 2' }] as OntimeRundown,
    };
    const mergedData = safeMerge(existing, newData);
    expect(mergedData.rundown).toEqual(newData.rundown);
  });

  it('merges the project key', () => {
    const newData = {
      project: {
        title: 'new title',
        publicInfo: 'new public info',
      },
    };
    // @ts-expect-error -- just testing
    const mergedData = safeMerge(existing, newData);
    expect(mergedData.project).toEqual({
      title: 'new title',
      description: 'existing description',
      publicUrl: 'existing public URL',
      publicInfo: 'new public info',
      backstageUrl: 'existing backstageUrl',
      backstageInfo: 'existing backstageInfo',
      projectLogo: null,
    });
  });

  it('merges the settings key', () => {
    const newData = {
      settings: {
        serverPort: 3000,
        language: 'pt',
      } as Settings,
    };
    const mergedData = safeMerge(existing, newData);
    expect(mergedData.settings).toEqual({
      app: 'ontime',
      version: '2.0.0',
      serverPort: 3000,
      operatorKey: null,
      editorKey: null,
      timeFormat: '24',
      language: 'pt',
    });
  });
  it('merges the osc key', () => {
    const newData = {
      osc: {
        portIn: 7777,
        subscriptions: [
          {
            id: 'unique',
            cycle: 'onStart',
            message: 'new message',
            enabled: true,
          },
        ],
      },
    };
    //@ts-expect-error -- testing partial merge
    const mergedData = safeMerge(existing, newData);
    expect(mergedData.osc).toMatchObject({
      portIn: 7777,
      portOut: 9999,
      targetIP: '127.0.0.1',
      enabledIn: false,
      enabledOut: false,
      subscriptions: [
        {
          id: 'unique',
          cycle: 'onStart',
          message: 'new message',
          enabled: true,
        },
      ],
    });
  });

  it('should merge the urlPresets key when present', () => {
    const existingData = {
      rundown: [],
      project: {
        title: '',
        description: '',
        publicUrl: '',
        publicInfo: '',
        backstageUrl: '',
        backstageInfo: '',
      },
      settings: {
        app: 'ontime',
        version: '2.0.0',
        serverPort: 4001,
        operatorKey: null,
        editorKey: null,
        timeFormat: '24',
        language: 'en',
      },
      viewSettings: {
        overrideStyles: false,
        endMessage: '',
      } as ViewSettings,
      urlPresets: [],
      customFields: {},
      osc: {
        portIn: 8888,
        portOut: 9999,
        targetIP: '127.0.0.1',
        enabledIn: false,
        enabledOut: false,
        subscriptions: [],
      },
      http: {
        enabledOut: false,
        subscriptions: [],
      },
    } as DatabaseModel;

    const newData = {
      urlPresets: [
        { enabled: true, alias: 'alias1', pathAndParams: '' },
        { enabled: true, alias: 'alias2', pathAndParams: '' },
      ] as URLPreset[],
    };

    const mergedData = safeMerge(existingData, newData);

    expect(mergedData.urlPresets).toEqual(newData.urlPresets);
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
