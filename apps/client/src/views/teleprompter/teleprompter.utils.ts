import type { ApiAction, EntryId, TeleprompterScriptEvent } from 'ontime-types';
import { eventAtRow, type TeleprompterLayout } from 'ontime-utils';

import type { TeleprompterViewCommand } from './teleprompter.keymap';

type TeleprompterPayload = Extract<ApiAction, { tag: 'teleprompter' }>['payload'];

/** Flip Screen in the navigation menu is a rotation, which the view composes with its own mirror flips */
export function composeFlip(flipH: boolean, flipV: boolean, isMirrored: boolean): { flipH: boolean; flipV: boolean } {
  return { flipH: flipH !== isMirrored, flipV: flipV !== isMirrored };
}

/** What a screen showing only the loaded event has to show */
export type LoadedEventScript = { events: TeleprompterScriptEvent[] } | { waiting: 'nothing-loaded' | 'no-script' };

/**
 * Narrows the script to the loaded event
 * Says what the screen is waiting for while nothing is loaded, or the loaded event has no text
 */
export function filterToLoadedEvent(
  events: TeleprompterScriptEvent[],
  loadedEventId: EntryId | null,
): LoadedEventScript {
  if (!loadedEventId) return { waiting: 'nothing-loaded' };
  const event = events.find((candidate) => candidate.id === loadedEventId);
  return event ? { events: [event] } : { waiting: 'no-script' };
}

/**
 * A row of the whole script, in the rows a screen shows, which can be fewer, as only the loaded event
 * @returns null while the row is in an event the screen does not show
 */
export function rowInShown(
  row: number,
  scriptLayout: TeleprompterLayout,
  shownLayout: TeleprompterLayout,
): number | null {
  const event = eventAtRow(scriptLayout, row);
  const shown = event ? shownLayout.events.find((candidate) => candidate.id === event.id) : undefined;
  if (!event || !shown) return null;
  return row - event.firstRow + shown.firstRow;
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

/** Lines to move for a screen, keeping a little of the last one in view */
export function linesPerScreen(screenHeight: number, rowHeight: number): number {
  if (rowHeight <= 0) return 1;
  return Math.max(1, Math.floor((screenHeight / rowHeight) * 0.85));
}

/** A view's command as the integration API takes it, for a controller to send to the server */
export function toTeleprompterPayload(command: TeleprompterViewCommand): TeleprompterPayload {
  switch (command.type) {
    case 'speed':
      return { speed: command.value };
    case 'speedBy':
      return { speed: { by: command.value } };
    case 'scroll':
      return { scroll: command.lines };
    case 'mode':
      return { mode: command.mode };
    case 'goto':
      return { goto: command.target };
    default:
      return command.type;
  }
}
