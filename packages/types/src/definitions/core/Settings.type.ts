import { TimeFormat } from './TimeFormat.type';

export type Settings = {
  app: 'ontime';
  version: 2;
  serverPort: number;
  editorKey: null | string;
  operatorKey: null | string;
  timeFormat: TimeFormat;
  language: string;
};
