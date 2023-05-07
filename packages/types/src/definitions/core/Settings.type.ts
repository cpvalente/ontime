import { TimeFormat } from './TimeFormat.type';

export type Settings = {
  app: 'ontime';
  version: 2;
  serverPort: 4001;
  editorKey: null | string;
  operatorKey: null | string;
  timeFormat: TimeFormat;
  language: string;
};
