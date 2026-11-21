import type { PhaseThresholds } from './PhaseThresholds.type.js';
import type { TimeFormat } from './TimeFormat.type.js';

export type Settings = {
  version: string;
  editorKey: null | string;
  operatorKey: null | string;
  timeFormat: TimeFormat;
  language: string;
  /**
   * Custom names for the aux timers, in order (index 0 is aux timer 1).
   * An empty string means the timer is unnamed and consumers show the default label
   */
  auxTimerNames: [string, string, string];
  /** When timers enter warning and danger, events can override them */
  phaseThresholds: PhaseThresholds;
};
