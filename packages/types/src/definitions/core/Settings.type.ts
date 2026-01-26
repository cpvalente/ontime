import type { TimeFormat } from './TimeFormat.type.js';

export type Settings = {
  version: string;
  editorKey: null | string;
  operatorKey: null | string;
  timeFormat: TimeFormat;
  language: string;
};
