import { DatabaseModel } from 'ontime-types';
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
  },
  viewSettings: {
    overrideStyles: false,
    normalColor: '#ffffffcc',
    warningColor: '#FFAB33',
    dangerColor: '#ED3333',
    freezeEnd: false,
    endMessage: '',
  },
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
};
