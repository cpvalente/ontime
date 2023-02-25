import { TimeFormat } from './TimeFormat.type';

export type Settings = {
  app: 'ontime';
  version: 2;
  serverPort: 4001;
  lock: null | boolean;
  pinCode: null | number | string;
  timeFormat: TimeFormat;
};
