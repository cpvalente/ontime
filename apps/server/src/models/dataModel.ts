import { DatabaseModel } from 'ontime-types';

export const dbModel: DatabaseModel = {
  rundown: [],
  eventData: {
    title: '',
    publicUrl: '',
    publicInfo: '',
    backstageUrl: '',
    backstageInfo: '',
    endMessage: '',
  },
  settings: {
    app: 'ontime',
    version: 2,
    serverPort: 4001,
    lock: null,
    pinCode: null,
    timeFormat: '24',
  },
  viewSettings: {
    overrideStyles: false,
    normalColor: '#ffffffcc',
    warningColor: '#FFAB33',
    warningThreshold: 120000,
    dangerColor: '#ED3333',
    dangerThreshold: 60000,
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
      onLoad: {
        url: '',
        enabled: false,
      },
      onStart: {
        url: '',
        enabled: false,
      },
      onUpdate: {
        url: '',
        enabled: false,
      },
      onPause: {
        url: '',
        enabled: false,
      },
      onStop: {
        url: '',
        enabled: false,
      },
      onFinish: {
        url: '',
        enabled: false,
      },
    },
    enabled: true,
  },
};
