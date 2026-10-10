import type { EntryId } from '../core/OntimeEntry.js';
import type { TeleprompterAnchor } from '../core/Teleprompter.type.js';

/** Whether the teleprompter reads on, in the words of Ontime's playback */
export type TeleprompterPlayback = 'play' | 'pause';

/**
 * How playback reads the script
 * - event: event by event, playback stops at the end of each event and follows the event Ontime loads
 * - script: the whole script, playback reads on to its end
 */
export type TeleprompterMode = 'event' | 'script';

/** Where playback stopped of its own accord */
export type TeleprompterStop = 'event' | 'script';

/**
 * The teleprompter transport: the reading position over time, like Ontime's timer
 * position = row(anchor) + speed × (now − at), clamped at the end playback runs to
 */
export type TeleprompterTransport = {
  playback: TeleprompterPlayback;
  mode: TeleprompterMode;
  /** lines per minute, from 1 to 100 */
  speed: number;
  /** where the reader was when the transport last changed, null while the script is empty */
  anchor: TeleprompterAnchor | null;
  /** when the anchor was true, as the server's time of day in milliseconds, the clock every Ontime client shares */
  at: number;
  /** set when playback stopped at the end of an event or of the script, cleared by any command */
  ended: TeleprompterStop | null;
};

/**
 * The reading position the server calculates for screens following the shared transport, in rows of one script
 * position = min(row + speed × (now − at), until) while playing, row while paused
 * It changes on commands and at boundaries, never with the passing of time,
 * so a screen which connects or reconnects calculates the same position as the others
 */
export type TeleprompterSync = {
  /** revision of the script whose rows these are, a screen with another revision waits for that script */
  revision: number;
  playback: TeleprompterPlayback;
  /** lines per minute */
  speed: number;
  /** the row at the reading position at `at`, as a fraction between rows */
  row: number;
  /** the row playback stops at: the end of the event, or of the script */
  until: number;
  /** when the reader was at `row`, as the server's time of day in milliseconds */
  at: number;
};

/** The event at the reading position */
export type TeleprompterReadingEvent = {
  id: EntryId;
  cue: string;
  title: string;
};

/** The teleprompter as people and integrations read it */
export type TeleprompterState = {
  playback: TeleprompterPlayback;
  mode: TeleprompterMode;
  /** lines per minute, from 1 to 100 */
  speed: number;
  /** the event at the reading position, null with an empty script */
  event: TeleprompterReadingEvent | null;
  /** milliseconds to finish the current event's text at the current speed, also while paused */
  remaining: number | null;
  /** server time of day in milliseconds when the current event's text finishes, null while paused */
  endsAt: number | null;
  /** set when playback stopped of its own accord at an end, cleared by any command */
  ended: TeleprompterStop | null;
};
