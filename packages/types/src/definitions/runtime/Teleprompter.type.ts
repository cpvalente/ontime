export type TeleprompterPlayback = 'playing' | 'paused';

/** Transport shared by every teleprompter view in remote control, set through the integration API */
export type TeleprompterState = {
  playback: TeleprompterPlayback;
  /** lines per minute */
  speed: number;
};
