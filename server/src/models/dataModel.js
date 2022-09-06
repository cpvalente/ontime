export const dbModelv1 = {
  events: [],
  event: {
    title: '',
    url: '',
    publicInfo: '',
    backstageInfo: '',
    endMessage: '',
  },
  settings: {
    app: 'ontime',
    version: 1,
    serverPort: 4001,
    lock: null,
    pinCode: null,
    timeFormat: '24',
  },
  views: {
    overrideStyles: false,
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
    port: 8888,
    portOut: 9999,
    targetIP: '127.0.0.1',
    enabled: true,
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
