export enum ClockSource {
  System = 'system',
  MIDI = 'MIDI',
  NTP = 'NTP',
}

export type ClockSettings = {
  source: ClockSource;
  settings: string;
  offset: number;
};
