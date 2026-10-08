import type { EntryId, TeleprompterScriptEvent } from 'ontime-types';

/** Flip Screen in the navigation menu is a rotation, which the view composes with its own mirror flips */
export function composeFlip(flipH: boolean, flipV: boolean, isMirrored: boolean): { flipH: boolean; flipV: boolean } {
  return { flipH: flipH !== isMirrored, flipV: flipV !== isMirrored };
}

/**
 * Narrows the script to the loaded event, with its group title
 * @returns the whole script while nothing is loaded, or null if the loaded event has no text to show
 */
export function filterToLoadedEvent(
  events: TeleprompterScriptEvent[],
  loadedEventId: EntryId | null,
): TeleprompterScriptEvent[] | null {
  if (!loadedEventId) return events;

  const event = events.find((candidate) => candidate.id === loadedEventId);
  if (!event || !event.lines.some((line) => line.kind === 'text')) return null;

  const hasGroupTitle = event.lines[0]?.kind === 'group';
  if (!event.group || hasGroupTitle) return [event];
  return [{ ...event, lines: [{ kind: 'group', text: event.group }, ...event.lines] }];
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
