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
    projectLogo: null,
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
  automation: {
    enabledAutomations: true,
    enabledOscIn: true,
    oscPortIn: 8888,
    triggers: [],
    automations: {},
  },
  qlab: {
    enabled: false,
    host: '127.0.0.1',
    port: 53000,
    listenPort: 53001,
    filterByColor: null,
    filterByType: null,
    filterByCueNumber: null,
    warningThreshold: 30000,
    dangerThreshold: 10000,
    timeout: 3000,
  },
};
