export enum LogLevel {
  Info = 'INFO',
  Warn = 'WARN',
  Error = 'ERROR',
  Severe = 'SEVERE',
}

export type Log = {
  id: string;
  origin: string;
  time: string;
  level: LogLevel;
  text: string;
};

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
