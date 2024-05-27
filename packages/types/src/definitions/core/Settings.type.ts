import type { TimeFormat } from './TimeFormat.type.js';

export type Settings = {
  app: 'ontime';
  version: string;
  serverPort: number;
  editorKey: null | string;
  operatorKey: null | string;
  timeFormat: TimeFormat;
  language: string;
  apiAllowTimeChange: boolean;
};
