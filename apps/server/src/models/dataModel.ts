import { DatabaseModel } from 'ontime-types';
import { ClockSource, ClockType } from '../services/Clock.js';
import { ONTIME_VERSION } from '../ONTIME_VERSION.js';

export const dbModel: DatabaseModel = {
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
    version: ONTIME_VERSION,
    serverPort: 4001,
    editorKey: null,
    operatorKey: null,
    timeFormat: '24',
    language: 'en',
    clockSource: { type: ClockType.System, settings: '', offset: 0 },
  },
  viewSettings: {
    overrideStyles: false,
    normalColor: '#ffffffcc',
    warningColor: '#FFAB33',
    warningThreshold: 120000,
    dangerColor: '#ED3333',
    dangerThreshold: 60000,
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
};
