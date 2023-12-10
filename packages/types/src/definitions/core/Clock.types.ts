export enum ClockSource {
  System = 'system',
  NTP = 'NTP',
}

export type ClockSettings = NtpClockSettings | SystemClockSettings;
export type ClockFeedback = { state: SystemClockState | NtpClockState; message: string };

type NtpClockSettings = {
  source: ClockSource.NTP;
  settings: {
    ntpServers: string[];
  };
  offset: number;
};

type SystemClockSettings = {
  source: ClockSource.System;
  offset: number;
};

export enum SystemClockState {
  None = 'None',
}

export enum NtpClockState {
  None = SystemClockState.None,
  Initializing = 'Initializing',
  OffsetUnder1Sec = 'Offset < 1sec',
  OffsetUnder1Min = 'Offset < 1min',
  OffsetOver1Min = 'Offset > 1min',
  NetworkError = 'Network Error',
}
