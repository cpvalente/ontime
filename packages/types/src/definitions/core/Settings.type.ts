import { TimeFormat } from './TimeFormat.type';
import { ClockSettings } from './Clock.types';

export type Settings = {
  app: 'ontime';
  version: string;
  serverPort: number;
  editorKey: null | string;
  operatorKey: null | string;
  timeFormat: TimeFormat;
  language: string;
  clockSettings: ClockSettings;
};
