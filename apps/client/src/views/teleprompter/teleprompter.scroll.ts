export const SPEED_STEP = 1;
export const SPEED_STEP_COARSE = 5;

export const MIN_CHARS_PER_LINE = 10;
export const MAX_CHARS_PER_LINE = 80;
const TEXT_SIZE_STEP_RATIO = 1.1;

/**
 * Steps the text size by a ratio, so each press is the same visual change at any size
 * Larger text fits fewer characters on a line
 */
export function stepCharsPerLine(current: number, steps: number): number {
  return clamp(Math.round(current / TEXT_SIZE_STEP_RATIO ** steps), MIN_CHARS_PER_LINE, MAX_CHARS_PER_LINE);
}

/** Longest frame we advance by, so a tab returning from the background does not jump the script */
export const MAX_FRAME_DELTA_MS = 100;

const CATCH_UP_RATE = 8;
const CATCH_UP_EPSILON = 0.5;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function linesPerMinuteToPxPerSecond(linesPerMinute: number, lineHeightPx: number): number {
  return (linesPerMinute / 60) * lineHeightPx;
}

export function frameDeltaSeconds(deltaMs: number): number {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) return 0;
  return Math.min(deltaMs, MAX_FRAME_DELTA_MS) / 1000;
}

/**
 * Advances without rounding, so sub-pixel movement per frame still accumulates.
 * A document which does not overflow may not have been measured yet, so it never counts as the end.
 */
export function advance(
  position: number,
  pxPerSecond: number,
  deltaSeconds: number,
  maxScroll: number,
): { position: number; atEnd: boolean } {
  const next = position + pxPerSecond * deltaSeconds;
  return { position: next, atEnd: maxScroll > 0 && next >= maxScroll };
}

/** Framerate independent ease, which lands exactly on the target so it can be cleared */
export function easeCatchUp(current: number, target: number, deltaSeconds: number): number {
  if (deltaSeconds <= 0) return current;
  const next = target + (current - target) * Math.exp(-CATCH_UP_RATE * deltaSeconds);
  return Math.abs(next - target) < CATCH_UP_EPSILON ? target : next;
}

/** Where a block sits inside the scrolled content, in layout pixels, ordered top to bottom */
export type BlockGeometry = { id: string; top: number; height: number };

/**
 * The read position as a place in the script rather than a scroll offset.
 * The rundown can be edited while it is read, and an edit above the reader moves every pixel below it.
 */
export type ScrollAnchor = { blockId: string; offset: number };

/** Index of the block the read point falls in, clamped to the ends of the script */
export function indexAtReadPoint(readPoint: number, blocks: BlockGeometry[]): number {
  if (blocks.length === 0) return -1;

  let index = 0;
  for (let i = 1; i < blocks.length; i += 1) {
    if (blocks[i].top > readPoint) break;
    index = i;
  }

  return index;
}

export function anchorAtReadPoint(readPoint: number, blocks: BlockGeometry[]): ScrollAnchor | null {
  const index = indexAtReadPoint(readPoint, blocks);
  if (index === -1) return null;
  return { blockId: blocks[index].id, offset: readPoint - blocks[index].top };
}

/**
 * The read point which puts an anchored place back under the reading line, or null when it cannot be found
 * @param previousOrder block ids as of the measure the anchor was taken against
 */
export function readPointForAnchor(
  anchor: ScrollAnchor,
  blocks: BlockGeometry[],
  previousOrder: string[],
): number | null {
  const matchIndex = blocks.findIndex((block) => block.id === anchor.blockId);
  if (matchIndex !== -1) {
    const match = blocks[matchIndex];
    // the block may have been edited shorter than the offset
    // its extent includes the gap before the next block, where a reader can be resting
    const next = blocks[matchIndex + 1];
    const extent = next ? Math.max(match.height, next.top - match.top) : match.height;
    return match.top + Math.min(anchor.offset, extent);
  }

  // the anchored event was deleted: land where its text used to begin, at the end of the nearest survivor before it
  const previousIndex = previousOrder.indexOf(anchor.blockId);
  for (let i = previousIndex - 1; i >= 0; i -= 1) {
    const survivor = blocks.find((block) => block.id === previousOrder[i]);
    if (survivor) return survivor.top + survivor.height;
  }

  return null;
}

/** Re-measuring can leave a parked position a fraction short of the boundary it stopped on */
const SEGMENT_BOUNDARY_EPSILON = 1;

/** The scroll position at which the reading line reaches the end of a segment */
export function segmentEndFor(block: BlockGeometry, readingOffset: number): number {
  return block.top + block.height - readingOffset;
}

/** Moves by a distance without leaving the segment under the reading line */
export function nudgeTargetFor(
  position: number,
  distance: number,
  readingOffset: number,
  blocks: BlockGeometry[],
  maxScroll: number,
): number {
  const index = indexAtReadPoint(position + readingOffset, blocks);
  if (index === -1) return clamp(position + distance, 0, maxScroll);
  const block = blocks[index];
  return clamp(
    position + distance,
    Math.max(0, block.top - readingOffset),
    Math.min(maxScroll, segmentEndFor(block, readingOffset)),
  );
}

/**
 * The segment playback should stop at, or null past the last one.
 * Each event has its own cue, so playback stops at its end rather than reading on into the next.
 * Takes the first segment ending ahead, so playing from a position parked on a boundary moves on.
 */
export function segmentAfter(position: number, readingOffset: number, blocks: BlockGeometry[]): BlockGeometry | null {
  for (const block of blocks) {
    if (segmentEndFor(block, readingOffset) > position + SEGMENT_BOUNDARY_EPSILON) return block;
  }

  return null;
}

/** How far, in lines, the reader may move the script before it counts as taking over from follow */
export const FOLLOW_BREAK_LINES = 1.5;

/**
 * Tells a deliberate scroll from momentum or a stray touch.
 * Takes the distance the reader moved, since easing and playback also move the script.
 */
export function hasBrokenFollow(readerDriftPx: number, lineHeightPx: number): boolean {
  if (lineHeightPx <= 0) return false;
  return Math.abs(readerDriftPx) > lineHeightPx * FOLLOW_BREAK_LINES;
}
