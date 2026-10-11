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

/** how many entries the server keeps and sends to a connecting client, clients keep the same */
export const logHistorySize = 100;

export type LogMessage = {
  type: 'ontime-log';
  payload: Log;
};

export enum LogOrigin {
  Client = 'CLIENT',
  Playback = 'PLAYBACK',
  Rx = 'RX',
  Server = 'SERVER',
  Tx = 'TX',
  User = 'USER',
}
