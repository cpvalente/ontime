import type { EntryId, TeleprompterScriptEvent, TeleprompterState, TeleprompterStop } from 'ontime-types';

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
  max: 40,
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
  | { type: 'top' };

/**
 * How the transport behaves
 * - cued (follow loaded event on): playback stops at the end of each event
 * - free run: playback reads on to the end of the script
 */
export type TeleprompterMode = { cued: boolean };

/** Positions closer than this are the same place, so playing from where playback stopped moves on */
const boundaryEpsilon = 1e-6;

/**
 * The row at the reading position at a moment, as a fraction between rows
 * Calculated from the transport and the clock, never measured
 * @returns null while the anchor is not in the script, as between an edit and the refetch of the script
 */
export function positionAt(
  state: TeleprompterState,
  layout: TeleprompterLayout,
  now: number,
  mode: TeleprompterMode,
): number | null {
  if (!state.anchor) return 0;
  const from = rowOfAnchor(layout, state.anchor);
  if (from === null) return null;
  if (!state.playing) return from;

  const travelled = (state.speed * (now - state.since)) / 60_000;
  return Math.min(from + travelled, playbackBound(layout, from, mode).row);
}

/** Where playback from a row runs to: the end of the event being read when cued, otherwise the end of the script */
export function playbackBound(
  layout: TeleprompterLayout,
  from: number,
  mode: TeleprompterMode,
): { row: number; stop: TeleprompterStop } {
  const { events } = layout;
  if (events.length === 0) return { row: from, stop: 'script' };

  const last = events[events.length - 1];
  const next = mode.cued ? events.find((event) => event.endRow > from + boundaryEpsilon) : undefined;
  if (!next || next === last) return { row: Math.max(from, last.endRow), stop: 'script' };
  return { row: next.endRow, stop: 'event' };
}

/**
 * Brings the transport up to a moment: playback which reached its end has stopped there
 * The event at the reading position is kept up to date
 */
export function settle(
  state: TeleprompterState,
  layout: TeleprompterLayout,
  now: number,
  mode: TeleprompterMode,
): TeleprompterState {
  if (!state.playing || !state.anchor) return withReader(state, layout, now, mode);

  const from = rowOfAnchor(layout, state.anchor);
  if (from === null) return state;

  const bound = playbackBound(layout, from, mode);
  const reachedAt = state.since + ((bound.row - from) / state.speed) * 60_000;
  if (now < reachedAt) return withReader(state, layout, now, mode);

  return withReader(
    { ...state, playing: false, anchor: anchorAtRow(layout, bound.row), since: now, stoppedAt: bound.stop },
    layout,
    now,
    mode,
  );
}

/**
 * How long until the transport changes on its own: playback reaching its end, or the reader moving into another event
 * @returns null when nothing will change without a command
 */
export function msUntilChange(
  state: TeleprompterState,
  layout: TeleprompterLayout,
  now: number,
  mode: TeleprompterMode,
): number | null {
  if (!state.playing || !state.anchor) return null;
  const position = positionAt(state, layout, now, mode);
  const from = rowOfAnchor(layout, state.anchor);
  if (position === null || from === null) return null;

  const next = layout.events.find((event) => event.firstRow > position);
  const target = Math.min(playbackBound(layout, from, mode).row, next?.firstRow ?? Infinity);
  return Math.ceil(((target - position) / state.speed) * 60_000);
}

/**
 * Applies a command at a moment
 * Moving the reader keeps the play state
 * @throws if the command names an event which is not in the script
 */
export function applyTransportCommand(
  state: TeleprompterState,
  command: TeleprompterTransportCommand,
  layout: TeleprompterLayout,
  now: number,
  mode: TeleprompterMode,
): TeleprompterState {
  const current = settle(state, layout, now, mode);
  const position = positionAt(current, layout, now, mode) ?? 0;
  // every command sets since, so a repeated command is still a change of state
  const rebased: TeleprompterState = { ...current, anchor: anchorAtRow(layout, position), since: now };

  const moveTo = (row: number) => {
    const lastRow = layout.events.at(-1)?.endRow ?? 0;
    const target = Math.min(Math.max(row, 0), lastRow);
    return { ...rebased, anchor: anchorAtRow(layout, target), stoppedAt: null };
  };
  const moveToEvent = (eventId: EntryId | undefined) => {
    if (!eventId) return rebased;
    return { ...rebased, anchor: startOfEvent(eventId), stoppedAt: null };
  };
  const readerIndex = () => {
    const reader = eventAtRow(layout, position);
    return reader ? layout.events.indexOf(reader) : -1;
  };

  let next: TeleprompterState;
  switch (command.type) {
    case 'play':
      next = { ...rebased, playing: true, stoppedAt: null };
      break;
    case 'pause':
      next = { ...rebased, playing: false, stoppedAt: null };
      break;
    case 'toggle':
      next = { ...rebased, playing: !current.playing, stoppedAt: null };
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
      next = moveToEvent(layout.events[readerIndex() + 1]?.id);
      break;
    case 'previous':
      next = moveToEvent(layout.events[readerIndex() - 1]?.id);
      break;
    case 'goto':
      if (!layout.events.some((event) => event.id === command.eventId)) throw new Error('Event not found');
      next = moveToEvent(command.eventId);
      break;
    case 'top':
      next = moveToEvent(layout.events[0]?.id);
      break;
  }

  // playing from where playback has nowhere to go stops it straight away
  return settle(next, layout, now, mode);
}

/**
 * Carries the transport over to a new version of the script, or to a new playback mode
 * The reader keeps their place in the text, and playback carries on from there without a jump
 */
export function reanchorTransport(
  state: TeleprompterState,
  previousEvents: TeleprompterScriptEvent[],
  nextEvents: TeleprompterScriptEvent[],
  now: number,
  mode: TeleprompterMode,
  previousMode: TeleprompterMode = mode,
): TeleprompterState {
  const previousLayout = makeTeleprompterLayout(previousEvents);
  const nextLayout = makeTeleprompterLayout(nextEvents);
  // where the reader got to under the mode they were playing in
  const current = settle(state, previousLayout, now, previousMode);
  const position = positionAt(current, previousLayout, now, previousMode);
  const place = position === null ? current.anchor : anchorAtRow(previousLayout, position);
  const anchor = reanchor(previousEvents, nextEvents, place);

  if (!current.playing && isSameAnchor(anchor, current.anchor)) return withReader(current, nextLayout, now, mode);
  return settle({ ...current, anchor, since: now }, nextLayout, now, mode);
}

function isSameAnchor(a: TeleprompterState['anchor'], b: TeleprompterState['anchor']): boolean {
  return a?.eventId === b?.eventId && a?.charOffset === b?.charOffset && a?.lines === b?.lines;
}

function withReader(
  state: TeleprompterState,
  layout: TeleprompterLayout,
  now: number,
  mode: TeleprompterMode,
): TeleprompterState {
  const position = state.anchor ? positionAt(state, layout, now, mode) : null;
  const reader = position === null ? null : eventAtRow(layout, position);
  const eventId = reader?.id ?? null;
  const cue = reader?.cue ?? null;
  if (state.eventId === eventId && state.cue === cue) return state;
  return { ...state, eventId, cue };
}
