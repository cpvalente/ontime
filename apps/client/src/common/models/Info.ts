import { Settings } from 'ontime-types';

type NetworkInterfaceType = {
  name: string;
  address: string;
};

export type InfoType = {
  networkInterfaces: NetworkInterfaceType[];
  settings: Pick<Settings, 'version' | 'serverPort'>;
};

export const ontimePlaceholderInfo: InfoType = {
  networkInterfaces: [],
  settings: {
    version: 2,
    serverPort: 4001,
  },
};
