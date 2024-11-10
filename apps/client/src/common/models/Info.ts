import { GetInfo } from 'ontime-types';

import { oscPlaceholderSettings } from './OscSettings';

export const ontimePlaceholderInfo: GetInfo = {
  networkInterfaces: [],
  version: '2.0.0',
  serverPort: 4001,
  osc: oscPlaceholderSettings,
  publicDir: '',
};
