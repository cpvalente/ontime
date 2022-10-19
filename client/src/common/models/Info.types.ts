import { OntimeSettingsType } from './OntimeSettings.type';

export type InfoType = {
  networkInterfaces: string[];
  settings: Pick<OntimeSettingsType, "version" | "serverPort" >
}

export const ontimePlaceholderInfo: InfoType = {
  networkInterfaces: [],
  settings: {
    version: 0,
    serverPort: 4001,
  },
};