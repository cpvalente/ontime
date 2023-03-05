export enum LogLevel {
  Info = 'INFO',
  Warn = 'WARN',
  Error = 'ERROR',
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
