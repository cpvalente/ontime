import type { EntryId, TeleprompterScriptEvent } from 'ontime-types';
import type { TeleprompterTransportCommand } from 'ontime-utils';

import type { TeleprompterPayload } from './teleprompter.keymap';

/** Flip Screen in the navigation menu is a rotation, which the view composes with its own mirror flips */
export function composeFlip(flipH: boolean, flipV: boolean, isMirrored: boolean): { flipH: boolean; flipV: boolean } {
  return { flipH: flipH !== isMirrored, flipV: flipV !== isMirrored };
}

/** What a screen showing only the loaded event has to show */
export type LoadedEventScript = { events: TeleprompterScriptEvent[] } | { waiting: 'nothing-loaded' | 'no-script' };

/**
 * Narrows the script to the loaded event, with its group title
 * Says what the screen is waiting for while nothing is loaded, or the loaded event has no text
 */
export function filterToLoadedEvent(
  events: TeleprompterScriptEvent[],
  loadedEventId: EntryId | null,
): LoadedEventScript {
  if (!loadedEventId) return { waiting: 'nothing-loaded' };

  const event = events.find((candidate) => candidate.id === loadedEventId);
  if (!event || !event.lines.some((line) => line.kind === 'text')) return { waiting: 'no-script' };

  const hasGroupTitle = event.lines[0]?.kind === 'group';
  if (!event.group || hasGroupTitle) return { events: [event] };
  return { events: [{ ...event, lines: [{ kind: 'group', text: event.group }, ...event.lines] }] };
}

/** Longest frame to animate over, so a tab returning from the background does not lurch */
const maxFrameSeconds = 0.1;
/** Closer than this, the screen follows the position exactly, as it does during playback */
const jumpRows = 0.5;
const catchUpRate = 8;

export function frameDeltaSeconds(deltaMs: number): number {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) return 0;
  return Math.min(deltaMs / 1000, maxFrameSeconds);
}

/**
 * Animates the screen towards the reading position after a jump, at the same pace at any framerate
 * Playback moves less than a row per frame, which the screen follows exactly
 */
export function easeTowards(shown: number, target: number, deltaSeconds: number): number {
  if (Math.abs(target - shown) < jumpRows) return target;
  return target + (shown - target) * Math.exp(-catchUpRate * deltaSeconds);
}

/** How long scrolling is gathered into one command */
const scrollInterval = 100;

/**
 * Groups scrolling into one command per interval, so a fast spin does not flood the server
 * The first move is sent straight away, so a single step does not wait
 */
export function createScrollBatcher(send: (lines: number) => void, interval = scrollInterval) {
  let pending = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    timer = null;
    if (pending === 0) return;
    const lines = pending;
    pending = 0;
    send(lines);
    timer = setTimeout(flush, interval);
  };

  return {
    add(lines: number) {
      if (timer) {
        pending += lines;
        return;
      }
      send(lines);
      timer = setTimeout(flush, interval);
    },
    dispose() {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = 0;
    },
  };
}

const wheelDeltaLine = 1;
const wheelDeltaPage = 2;

/** Converts a wheel movement into lines of the script */
export function wheelToLines(deltaY: number, deltaMode: number, rowHeight: number, screenLines: number): number {
  if (deltaMode === wheelDeltaLine) return deltaY;
  if (deltaMode === wheelDeltaPage) return deltaY * screenLines;
  return rowHeight > 0 ? deltaY / rowHeight : 0;
}

/** Lines to move for a screen, keeping a little of the last one in view */
export function linesPerScreen(screenHeight: number, rowHeight: number): number {
  if (rowHeight <= 0) return 1;
  return Math.max(1, Math.floor((screenHeight / rowHeight) * 0.85));
}

/**
 * Turns a command from the keyboard or the buttons into a change to a local transport
 * @returns null for a command with nothing to act on, as going back to the loaded event while nothing is loaded
 */
export function toTransportCommand(
  payload: TeleprompterPayload,
  loadedEventId: EntryId | null,
): TeleprompterTransportCommand | null {
  if (typeof payload === 'string') {
    if (payload !== 'loaded') return { type: payload };
    return loadedEventId ? { type: 'goto', eventId: loadedEventId } : null;
  }
  if ('scroll' in payload) return { type: 'scroll', lines: payload.scroll };
  if ('speed' in payload) {
    return typeof payload.speed === 'number'
      ? { type: 'speed', value: payload.speed }
      : { type: 'speedBy', value: payload.speed.by };
  }
  return null;
}
