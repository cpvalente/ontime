import { OntimeSettingsType } from './OntimeSettings.type';

type NetworkInterfaceType = {
  name: string;
  address: string;
}

export type InfoType = {
  networkInterfaces: NetworkInterfaceType[];
  settings: Pick<OntimeSettingsType, 'version' | 'serverPort'>
}

export const ontimePlaceholderInfo: InfoType = {
  networkInterfaces: [],
  settings: {
    version: 0,
    serverPort: 4001,
  },
};