import { GetInfo } from 'ontime-types';

import { appVersion } from '../../externals';

export const ontimePlaceholderInfo: GetInfo = {
  networkInterfaces: [],
  version: appVersion,
  serverPort: 4001,
  publicDir: '',
};
