import type { Instant } from '../core/Temporal.js';

export enum LogLevel {
  Info = 'INFO',
  Warn = 'WARN',
  Error = 'ERROR',
  Severe = 'SEVERE',
}

export type Log = {
  id: string;
  origin: string;
  /** when the entry was created, in the clock of the machine which created it */
  at: Instant;
  /** time of day at the machine which created the entry, for display */
  time: string;
  level: LogLevel;
  text: string;
};

/** what an entry is about, the log shows and searches these words */
export enum LogOrigin {
  /** requests received through the API: HTTP, OSC, websocket */
  Api = 'API',
  /** messages sent by automations */
  Automation = 'AUTOMATION',
  Client = 'CLIENT',
  Playback = 'PLAYBACK',
  Server = 'SERVER',
}
