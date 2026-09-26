import type { TimeFormat } from './TimeFormat.type.js';

export type Settings = {
  version: string;
  editorKey: null | string;
  operatorKey: null | string;
  timeFormat: TimeFormat;
  language: string;
  /**
   * IANA name of the timezone the rundown is planned in, eg: Europe/Lisbon
   * null resolves to the server timezone
   */
  productionTimezone: string | null;
  /**
   * Custom names for the aux timers, in order (index 0 is aux timer 1).
   * An empty string means the timer is unnamed and consumers show the default label
   */
  auxTimerNames: [string, string, string];
};
