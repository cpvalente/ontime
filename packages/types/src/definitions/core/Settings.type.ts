import { TimeFormat } from './TimeFormat.type';

export type Settings = {
  app: 'ontime';
  version: 2;
  serverPort: 4001;
  editorKey: null | number | string;
  operatorKey: null | number | string;
  timeFormat: TimeFormat;
  language: string;
};
