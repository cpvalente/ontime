import { GetInfo, OSCSettings } from 'ontime-types';

export const oscPlaceholderSettings: OSCSettings = {
  portIn: 0,
  portOut: 0,
  targetIP: '',
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
};

export const ontimePlaceholderInfo: GetInfo = {
  networkInterfaces: [],
  version: '2.0.0',
  serverPort: 4001,
  osc: oscPlaceholderSettings,
  cssOverride: '',
};
