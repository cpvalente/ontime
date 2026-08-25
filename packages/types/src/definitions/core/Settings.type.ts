import type { TimeFormat } from './TimeFormat.type.js';

export type Settings = {
  version: string;
  editorKey: null | string;
  operatorKey: null | string;
  timeFormat: TimeFormat;
  language: string;
  /**
   * Custom names for the aux timers, one entry per aux timer in order (index 0 is aux timer 1).
   * An empty string means the timer is unnamed and consumers show the default label
   */
  auxTimerNames: string[];
};
