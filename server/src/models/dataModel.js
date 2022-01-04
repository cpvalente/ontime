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
  },
  aliases: [],
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
