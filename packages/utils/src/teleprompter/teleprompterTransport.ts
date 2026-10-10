import type {
  EntryId,
  TeleprompterMode,
  TeleprompterScriptEvent,
  TeleprompterState,
  TeleprompterStop,
  TeleprompterSync,
  TeleprompterTransport,
} from 'ontime-types';

import { dayInMs } from '../date-utils/conversionUtils.js';
import {
  anchorAtRow,
  eventAtRow,
  makeTeleprompterLayout,
  reanchor,
  rowOfAnchor,
  startOfEvent,
  type TeleprompterLayout,
} from './teleprompterPosition.js';

/** Teleprompter speed bounds, in lines per minute: playback only reads forwards and always moves */
export const teleprompterSpeed = {
  min: 1,
  max: 100,
} as const;

export function clampTeleprompterSpeed(speed: number): number {
  return Math.min(Math.max(speed, teleprompterSpeed.min), teleprompterSpeed.max);
}

/** A change to the transport, with the event it goes to already resolved */
export type TeleprompterTransportCommand =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'toggle' }
  | { type: 'speed'; value: number }
  | { type: 'speedBy'; value: number }
  | { type: 'scroll'; lines: number }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'goto'; eventId: EntryId }
  | { type: 'top' }
  | { type: 'mode'; mode: TeleprompterMode | 'toggle' };

/**
 * A command as hosts receive it, naming events for the host to resolve in the script
 * An index counts the events of the script, from 1
 */
export type TeleprompterCommand =
  | Exclude<TeleprompterTransportCommand, { type: 'goto' }>
  | { type: 'goto'; target: { cue: string } | { id: string } | { index: number } | 'loaded' };

/** A client's copy of the server clock runs behind it by up to the time a message takes to arrive */
const clockLagTolerance = 60_000;

/**
 * Time since the transport changed, on the server's clock
 * Times are times of day, so a time before the change was taken after midnight,
 * unless it is just before: a client clock running a little behind the server's, for which no time has passed
 */
function elapsedSince(at: number, now: number): number {
  const elapsed = now < at ? now - at + dayInMs : now - at;
  return elapsed > dayInMs - clockLagTolerance ? 0 : elapsed;
}

/** Positions closer than this are the same place, so playing from where playback stopped moves on */
const boundaryEpsilon = 1e-6;

/**
 * Previous restarts the event being read once the reader is more than this many lines into its text,
 * and goes to the event before otherwise, like a media player
 */
export const previousRestartLines = 1;

/**
 * The row at the reading position at a moment, as a fraction between rows
 * Calculated from the transport and the clock, never measured
 * @returns null while the anchor is not in the script, as between an edit and the refetch of the script
 */
export function positionAt(transport: TeleprompterTransport, layout: TeleprompterLayout, now: number): number | null {
  if (!transport.anchor) return 0;
  const from = rowOfAnchor(layout, transport.anchor);
  if (from === null) return null;
  if (transport.playback !== 'play') return from;

  const travelled = (transport.speed * elapsedSince(transport.at, now)) / 60_000;
  return Math.min(from + travelled, playbackBound(layout, from, transport.mode).row);
}

/** Where playback from a row runs to: the end of the event being read event by event, otherwise the end of the script */
export function playbackBound(
  layout: TeleprompterLayout,
  from: number,
  mode: TeleprompterMode,
): { row: number; stop: TeleprompterStop } {
  const { events } = layout;
  if (events.length === 0) return { row: from, stop: 'script' };

  const last = events[events.length - 1];
  const next = mode === 'event' ? events.find((event) => event.endRow > from + boundaryEpsilon) : undefined;
  if (!next || next === last) return { row: Math.max(from, last.endRow), stop: 'script' };
  return { row: next.endRow, stop: 'event' };
}

/** Brings the transport up to a moment: playback which reached its end has stopped there */
export function settle(
  transport: TeleprompterTransport,
  layout: TeleprompterLayout,
  now: number,
): TeleprompterTransport {
  if (transport.playback !== 'play' || !transport.anchor) return transport;

  const from = rowOfAnchor(layout, transport.anchor);
  if (from === null) return transport;

  const bound = playbackBound(layout, from, transport.mode);
  const msToBound = ((bound.row - from) / transport.speed) * 60_000;
  if (elapsedSince(transport.at, now) < msToBound) return transport;

  return { ...transport, playback: 'pause', anchor: anchorAtRow(layout, bound.row), at: now, ended: bound.stop };
}

/**
 * Applies a command at a moment
 * Moving the reader keeps the play state, and any command clears where playback ended
 * @throws if the command names an event which is not in the script
 */
export function applyTransportCommand(
  transport: TeleprompterTransport,
  command: TeleprompterTransportCommand,
  layout: TeleprompterLayout,
  now: number,
): TeleprompterTransport {
  const current = settle(transport, layout, now);
  const isPlaying = current.playback === 'play';
  const position = positionAt(current, layout, now) ?? 0;
  // every command sets the time, so a repeated command is still a change of state
  // only playback moves the reader off their anchor, which a row would round to the start of its line
  const anchor = isPlaying ? anchorAtRow(layout, position) : current.anchor;
  const rebased: TeleprompterTransport = { ...current, anchor, at: now, ended: null };

  const moveTo = (row: number) => {
    const lastRow = layout.events.at(-1)?.endRow ?? 0;
    const target = Math.min(Math.max(row, 0), lastRow);
    return { ...rebased, anchor: anchorAtRow(layout, target) };
  };
  const moveToEvent = (eventId: EntryId | undefined) => {
    if (!eventId) return rebased;
    return { ...rebased, anchor: startOfEvent(eventId) };
  };
  const reader = eventAtRow(layout, position);
  const readerIndex = reader ? layout.events.indexOf(reader) : -1;

  let next: TeleprompterTransport;
  switch (command.type) {
    case 'play':
      next = { ...rebased, playback: 'play' };
      break;
    case 'pause':
      next = { ...rebased, playback: 'pause' };
      break;
    case 'toggle':
      next = { ...rebased, playback: isPlaying ? 'pause' : 'play' };
      break;
    case 'speed':
      next = { ...rebased, speed: clampTeleprompterSpeed(command.value) };
      break;
    case 'speedBy':
      next = { ...rebased, speed: clampTeleprompterSpeed(current.speed + command.value) };
      break;
    case 'scroll':
      next = moveTo(position + command.lines);
      break;
    case 'next':
      next = moveToEvent(layout.events[readerIndex + 1]?.id);
      break;
    case 'previous': {
      const isPastStart = reader !== null && position > reader.startRow + previousRestartLines;
      next = moveToEvent(isPastStart ? reader.id : layout.events[readerIndex - 1]?.id);
      break;
    }
    case 'goto':
      if (!layout.events.some((event) => event.id === command.eventId)) throw new Error('Event not found');
      next = moveToEvent(command.eventId);
      break;
    case 'top':
      next = moveToEvent(layout.events[0]?.id);
      break;
    case 'mode':
      next = { ...rebased, mode: command.mode === 'toggle' ? otherMode(current.mode) : command.mode };
      break;
  }

  // playing from where playback has nowhere to go stops it straight away
  return settle(next, layout, now);
}

function otherMode(mode: TeleprompterMode): TeleprompterMode {
  return mode === 'event' ? 'script' : 'event';
}

/**
 * Carries the transport over to a new version of the script
 * The reader keeps their place in the text, and playback carries on from there without a jump
 */
export function reanchorTransport(
  transport: TeleprompterTransport,
  previousEvents: TeleprompterScriptEvent[],
  nextEvents: TeleprompterScriptEvent[],
  now: number,
): TeleprompterTransport {
  const previousLayout = makeTeleprompterLayout(previousEvents);
  const nextLayout = makeTeleprompterLayout(nextEvents);
  // where the reader got to in the previous script
  const current = settle(transport, previousLayout, now);
  const isPlaying = current.playback === 'play';
  // only playback moves the reader off their anchor, which a row would round to the start of its line
  const position = isPlaying ? positionAt(current, previousLayout, now) : null;
  const place = position === null ? current.anchor : anchorAtRow(previousLayout, position);
  const anchor = reanchor(previousEvents, nextEvents, place);

  if (!isPlaying && isSameAnchor(anchor, current.anchor)) return current;
  return settle({ ...current, anchor, at: now }, nextLayout, now);
}

function isSameAnchor(a: TeleprompterTransport['anchor'], b: TeleprompterTransport['anchor']): boolean {
  return a?.eventId === b?.eventId && a?.charOffset === b?.charOffset && a?.lines === b?.lines;
}

/**
 * The teleprompter as people and integrations read it, at a moment
 * Every view, and the server, describe a transport with it, so they all show the same thing
 */
export function describeTransport(
  transport: TeleprompterTransport,
  layout: TeleprompterLayout,
  now: number,
): TeleprompterState {
  const current = settle(transport, layout, now);
  const { playback, mode, speed, ended } = current;
  const position = current.anchor ? positionAt(current, layout, now) : null;
  const reader = position === null ? null : eventAtRow(layout, position);
  if (position === null || !reader) {
    return { playback, mode, speed, event: null, remaining: null, endsAt: null, ended };
  }

  const remaining = Math.max(0, Math.ceil(((reader.endRow - position) / speed) * 60_000));
  const endsAt = playback === 'play' ? (now + remaining) % dayInMs : null;

  return {
    playback,
    mode,
    speed,
    event: { id: reader.id, cue: reader.cue, title: reader.title },
    remaining,
    endsAt,
    ended,
  };
}

/**
 * The reading position screens following a transport animate from, in rows of the script with this revision
 * Only the host which holds the transport resolves its anchor, so every screen counts from the same row
 */
export function describeSync(
  transport: TeleprompterTransport,
  layout: TeleprompterLayout,
  revision: number,
): TeleprompterSync {
  const { playback, speed, at } = transport;
  const row = transport.anchor ? (rowOfAnchor(layout, transport.anchor) ?? 0) : 0;
  const until = playback === 'play' ? playbackBound(layout, row, transport.mode).row : row;
  return { revision, playback, speed, row, until, at };
}

/** The row at the reading position at a moment, from what the host published */
export function syncPositionAt(sync: TeleprompterSync, now: number): number {
  if (sync.playback !== 'play') return sync.row;
  return Math.min(sync.row + (sync.speed * elapsedSince(sync.at, now)) / 60_000, sync.until);
}
