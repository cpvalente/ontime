import { TimeFormat } from './TimeFormat.type';
import { ClockSource } from '../../../../../apps/server/src/services/Clock.js';
export type Settings = {
  app: 'ontime';
  version: 2;
  serverPort: number;
  editorKey: null | string;
  operatorKey: null | string;
  timeFormat: TimeFormat;
  language: string;
  clockSource: ClockSource;
};
