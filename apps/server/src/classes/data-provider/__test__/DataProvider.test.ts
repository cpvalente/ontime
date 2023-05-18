import { safeMerge } from '../DataProvider.utils.js';

describe('safeMerge', () => {
  const existing = {
    rundown: [],
    eventData: {
      title: 'existing title',
      publicUrl: 'existing public URL',
      backstageUrl: 'existing backstageUrl',
      backstageInfo: 'existing backstageInfo',
    },
    settings: {
      app: 'ontime',
      version: 2,
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
    http: {
      enabled: true,
      user: null,
      pwd: null,
    },
  };

  it('returns existing data if new data is not provided', () => {
    const mergedData = safeMerge(existing, undefined);
    expect(mergedData).toEqual(existing);
  });

  it('merges the rundown key', () => {
    const newData = {
      rundown: [{ name: 'item 1' }, { name: 'item 2' }],
    };
    const mergedData = safeMerge(existing, newData);
    expect(mergedData.rundown).toEqual(newData.rundown);
  });

  it('merges the event key', () => {
    const newData = {
      eventData: {
        title: 'new title',
        publicInfo: 'new public info',
      },
    };
    const mergedData = safeMerge(existing, newData);
    expect(mergedData.eventData).toEqual({
      title: 'new title',
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
      },
    };
    const mergedData = safeMerge(existing, newData);
    expect(mergedData.settings).toEqual({
      app: 'ontime',
      version: 2,
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
      event: {
        title: '',
        publicUrl: '',
        publicInfo: '',
        backstageUrl: '',
        backstageInfo: '',
      },
      settings: {
        app: 'ontime',
        version: 2,
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
      http: {
        user: null,
        pwd: null,
        messages: {
          onLoad: [],
          onStart: [],
          onUpdate: [],
          onPause: [],
          onStop: [],
          onFinish: [],
        },
        enabled: true,
      },
    };

    const newData = {
      aliases: ['alias1', 'alias2'],
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

    const result = safeMerge(existing, newData);
    expect(result.userFields).toEqual(expected);
  });
});
