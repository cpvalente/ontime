export type ClientType = 'unknown' | 'ontime' | string;

export type TeleprompterControlMode = 'free' | 'controlled';
export type TeleprompterPlayback = 'playing' | 'paused';
export type TeleprompterParkedAt = 'segment' | 'script' | null;
export type TeleprompterControlState = {
  mode: TeleprompterControlMode;
  playback: TeleprompterPlayback;
  speed: number;
  isFollowingLoadedEvent: boolean;
  parkedAt: TeleprompterParkedAt;
};

export type Client = {
  name: string;
  type: ClientType;
  identify: boolean;
  origin: string;
  path: string;
  teleprompter?: TeleprompterControlState;
};

export type ClientList = Record<string, Client>;
