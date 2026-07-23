import type { TimeFormat } from './TimeFormat.type.js';

export type Settings = {
  version: string;
  editorKey: null | string;
  operatorKey: null | string;
  timeFormat: TimeFormat;
  language: string;
  /** Custom names for the aux timers, indexed by aux timer (1, 2, 3). Empty string falls back to the default label */
  auxTimerNames: string[];
};
