import { TimeFormat } from './OntimeTypes';

export type OntimeSettingsType = {
  app: string;
  version: number;
  serverPort: number;
  lock: null | boolean;
  pinCode: null | number | string;
  timeFormat: TimeFormat;
}

export const ontimePlaceholderSettings: OntimeSettingsType = {
  app: 'ontime',
  version: 1,
  serverPort: 4001,
  lock: null,
  pinCode: null,
  timeFormat: '24',
};
