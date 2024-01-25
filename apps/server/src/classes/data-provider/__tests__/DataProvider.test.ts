import { Alias, DatabaseModel, OntimeRundown, Settings } from 'ontime-types';
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
      endMessage: 'existing endMessage',
    },
    aliases: [],
    userFields: {
      user0: 'existing user0',
      user1: 'existing user1',
    },
    osc: {
      portIn: 8888,
      portOut: 9999,
      targetIP: '127.0.0.1',
      enabledIn: false,
      enabledOut: false,
      subscriptions: {
        onLoad: [],
        onStart: [],
        onPause: [],
        onStop: [],
        onUpdate: [],
        onFinish: [],
      },
    },
  } as DatabaseModel;

  it('returns existing data if new data is not provided', () => {
    const mergedData = safeMerge(existing, undefined);
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
        subscriptions: {
          onStart: [
            {
              id: 'unique',
              message: 'new message',
              enabled: true,
            },
          ],
        },
      },
    };
    //@ts-expect-error -- testing partial merge
    const mergedData = safeMerge(existing, newData);
    expect(mergedData.osc).toEqual({
      portIn: 7777,
      portOut: 9999,
      targetIP: '127.0.0.1',
      enabledIn: false,
      enabledOut: false,
      subscriptions: {
        onLoad: [],
        onStart: [
          {
            id: 'unique',
            message: 'new message',
            enabled: true,
          },
        ],
        onPause: [],
        onStop: [],
        onUpdate: [],
        onFinish: [],
      },
    });
  });

  it('should merge the aliases key when present', () => {
    const existingData = {
      rundown: [],
      project: {
        title: '',
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
      },
      aliases: [],
      userFields: {
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
      },
      osc: {
        portIn: 8888,
        portOut: 9999,
        targetIP: '127.0.0.1',
        enabledIn: false,
        enabledOut: false,
        subscriptions: {
          onLoad: [],
          onStart: [],
          onPause: [],
          onStop: [],
          onUpdate: [],
          onFinish: [],
        },
      },
    } as DatabaseModel;

    const newData = {
      aliases: [
        { enabled: true, alias: 'alias1', pathAndParams: '' },
        { enabled: true, alias: 'alias2', pathAndParams: '' },
      ] as Alias[],
    };

    const mergedData = safeMerge(existingData, newData);

    expect(mergedData.aliases).toEqual(newData.aliases);
  });

  it('merges userFields into existing object', () => {
    const existing = {
      userFields: {
        user0: 'Alice',
        user1: 'Bob',
      },
    };

    const newData = {
      userFields: {
        user2: 'Charlie',
        user3: 'David',
        user4: null,
      },
    };

    const expected = {
      user0: 'Alice',
      user1: 'Bob',
      user2: 'Charlie',
      user3: 'David',
    };

    //@ts-expect-error -- testing partial merge
    const result = safeMerge(existing, newData);
    expect(result.userFields).toEqual(expected);
  });
});
