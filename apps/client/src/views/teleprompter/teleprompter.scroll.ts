export const MIN_SPEED = 1;
export const MAX_SPEED = 40;
export const DEFAULT_SPEED = 14;

export const SPEED_STEP = 1;
export const SPEED_STEP_COARSE = 5;

export const MIN_FONT_SIZE = 12;
export const MAX_FONT_SIZE = 400;
const FONT_SIZE_STEP_RATIO = 1.1;

export function stepFontSize(current: number, steps: number): number {
  return clamp(Math.round(current * FONT_SIZE_STEP_RATIO ** steps), MIN_FONT_SIZE, MAX_FONT_SIZE);
}

export const MAX_FRAME_DELTA_MS = 100;

const CATCH_UP_RATE = 8;
const CATCH_UP_EPSILON = 0.5;

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function clampSpeed(value: number): number {
  return clamp(value, MIN_SPEED, MAX_SPEED);
}

export function linesPerMinuteToPxPerSecond(linesPerMinute: number, lineHeightPx: number): number {
  return (linesPerMinute / 60) * lineHeightPx;
}

export function frameDeltaSeconds(deltaMs: number): number {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) return 0;
  return Math.min(deltaMs, MAX_FRAME_DELTA_MS) / 1000;
}

export function advance(
  position: number,
  pxPerSecond: number,
  deltaSeconds: number,
  maxScroll: number,
): { position: number; atEnd: boolean } {
  const next = position + pxPerSecond * deltaSeconds;
  return { position: next, atEnd: maxScroll > 0 && next >= maxScroll };
}

export function easeCatchUp(current: number, target: number, deltaSeconds: number): number {
  if (deltaSeconds <= 0) return current;
  const next = target + (current - target) * Math.exp(-CATCH_UP_RATE * deltaSeconds);
  return Math.abs(next - target) < CATCH_UP_EPSILON ? target : next;
}

/** Where a block sits inside the scrolled content, in layout pixels, ordered top to bottom. */
export type BlockGeometry = { id: string; top: number; height: number };

/**
 * The read position expressed as a place in the script rather than an offset
 * into the document.
 *
 * A rundown is edited while it is being read, and an edit above the reader
 * moves every pixel below it. Professional prompters cue a story plus an
 * offset into it for exactly this reason: the text under the reading line is
 * the position, the scroll offset is only how it is currently drawn.
 */
export type ScrollAnchor = { blockId: string; offset: number };

/**
 * Index of the block the read point falls in, clamped to the ends of the script.
 *
 * Scans rather than bisects: this runs once a frame over a show's worth of
 * events, and a scan makes no assumption the caller has to keep true.
 */
export function indexAtReadPoint(readPoint: number, blocks: BlockGeometry[]): number {
  if (blocks.length === 0) return -1;

  // starts on the first block, which is where a read point above the script lands
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
 * The read point which puts an anchored place in the script back under the
 * reading line, or null when it cannot be found at all.
 */
export function readPointForAnchor(
  anchor: ScrollAnchor,
  blocks: BlockGeometry[],
  previousOrder: string[],
): number | null {
  const match = blocks.find((block) => block.id === anchor.blockId);
  if (match) {
    // The block may have been edited shorter than the offset into it.
    return match.top + Math.min(anchor.offset, match.height);
  }

  // The anchored event was deleted mid-read. Land on the end of the nearest
  // event which preceded it and survives, which is where the deleted text
  // used to begin, rather than wherever its pixels now happen to point.
  const previousIndex = previousOrder.indexOf(anchor.blockId);
  for (let i = previousIndex - 1; i >= 0; i -= 1) {
    const survivor = blocks.find((block) => block.id === previousOrder[i]);
    if (survivor) return survivor.top + survivor.height;
  }

  return null;
}

/** Keeps a position resting on a boundary from counting as still being before it. */
const SEGMENT_BOUNDARY_EPSILON = 1;

/** The position at which the reading line reaches the end of a segment. */
export function segmentEndFor(block: BlockGeometry, readingOffset: number): number {
  return block.top + block.height - readingOffset;
}

/**
 * The segment playback should run to, or null past the last one, where the end
 * of the script is the bound.
 *
 * An event is a unit of time with a stop of its own, so running the script on
 * into the next one reads a segment nobody has cued: at a conference that is
 * the next speaker's script, while they are still walking on.
 *
 * Takes the first segment ending ahead rather than the one the position sits
 * in, so that starting again from a position already parked on a boundary
 * carries on into the next segment instead of stopping where it already is.
 * Decide this once when playback starts: re-deciding it against a position
 * which is moving lets the bound outrun the reader and never arrive.
 */
export function segmentAfter(position: number, readingOffset: number, blocks: BlockGeometry[]): BlockGeometry | null {
  for (const block of blocks) {
    if (segmentEndFor(block, readingOffset) > position + SEGMENT_BOUNDARY_EPSILON) return block;
  }

  return null;
}

/** How far, in lines, the reader may move the script themselves before it counts as taking over. */
export const FOLLOW_BREAK_LINES = 1.5;

/**
 * Distinguishes a deliberate scroll away from the read position from momentum
 * or a stray touch.
 *
 * Takes what the reader moved rather than where the script ended up: while
 * following eases towards a newly loaded event, and while playback carries the
 * script along, the distance to the target is the prompter's own doing.
 */
export function hasBrokenFollow(readerDriftPx: number, lineHeightPx: number): boolean {
  if (lineHeightPx <= 0) return false;
  return Math.abs(readerDriftPx) > lineHeightPx * FOLLOW_BREAK_LINES;
}
