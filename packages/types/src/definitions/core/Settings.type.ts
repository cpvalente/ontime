import type { EndAction } from '../EndAction.type.js';
import type { TimerType } from '../TimerType.type.js';
import type { TimeStrategy } from '../TimeStrategy.type.js';
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
  rundownDefaults: RundownDefaults;
};

export type RundownDefaults = {
  /** duration of a new event, in milliseconds */
  duration: number;
  linkPrevious: boolean;
  timeStrategy: TimeStrategy;
  timerType: TimerType;
  endAction: EndAction;
  /** new events and milestones take the colour of their parent group */
  inheritGroupColour: boolean;
};

/** The fields a client can change; version belongs to the project file */
export type SettingsPatch = Partial<Omit<Settings, 'version'>>;
