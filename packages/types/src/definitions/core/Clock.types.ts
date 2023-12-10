export enum ClockSource {
  System = 'system',
  NTP = 'NTP',
}

export type ClockSettings = {
  source: ClockSource;
  settings: string;
  offset: number;
};
