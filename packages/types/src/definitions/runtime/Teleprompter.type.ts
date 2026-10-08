import type { TeleprompterAnchor } from '../core/Teleprompter.type.js';

/** Where playback stopped of its own accord */
export type TeleprompterStop = 'event' | 'script';

/**
 * The teleprompter transport: the reading position over time, like Ontime's timer
 * position = row(anchor) + speed × (now − since), clamped at the end playback runs to
 */
export type TeleprompterState = {
  playing: boolean;
  /** lines per minute, negative scrolls backwards */
  speed: number;
  /** where the reader was when the transport last changed, null while the script is empty */
  anchor: TeleprompterAnchor | null;
  /** when the anchor was set, as epoch milliseconds of the server clock */
  since: number;
  /** the event at the reading position */
  eventId: string | null;
  cue: string | null;
  /** set when playback stopped at the end of an event or of the script */
  stoppedAt: TeleprompterStop | null;
};
