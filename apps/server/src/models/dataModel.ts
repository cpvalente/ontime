import { TimerLifeCycleKey } from '../services/integration-service/IIntegration.js';

export type OscSubscriptions = { [key in TimerLifeCycleKey]?: { message: string; enabled: boolean } };

export interface OSCSettings {
  portIn: number;
  portOut: number;
  targetIP: string;
  enabledIn: boolean;
  enabledOut: boolean;
  subscriptions: OscSubscriptions;
}

export type DatabaseModel = {
  rundown: any;
  event: any;
  settings: any;
  views: any;
  aliases: any;
  userFields: any;
  osc: OSCSettings;
  http: any;
};

export const dbModel: DatabaseModel = {
  rundown: [],
  event: {
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
    portIn: 8888,
    portOut: 9999,
    targetIP: '127.0.0.1',
    enabledIn: false,
    enabledOut: false,
    subscriptions: {
      onLoad: {
        message: '',
        enabled: false,
      },
      onStart: {
        message: '',
        enabled: false,
      },
      onPause: {
        message: '',
        enabled: false,
      },
      onStop: {
        message: '',
        enabled: false,
      },
      onUpdate: {
        message: '',
        enabled: false,
      },
      onFinish: {
        message: '',
        enabled: false,
      },
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
