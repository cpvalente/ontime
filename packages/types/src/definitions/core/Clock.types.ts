export enum ClockSource {
  System = 'system',
  NTP = 'NTP',
}

export type ClockFeedback = { state: SystemClockState | NtpClockState; message: string };

export type ClockSettings = {
  source: ClockSource.System | ClockSource.NTP;
  settings: unknown;
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
