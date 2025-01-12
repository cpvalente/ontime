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
    automations: [],
    blueprints: {},
  },
};
