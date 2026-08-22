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

/** How far, in lines, the reader may drift from the follow target before it counts as taking over. */
export const FOLLOW_BREAK_LINES = 1.5;

/** Distinguishes a deliberate scroll away from the read position from momentum or a stray touch. */
export function hasBrokenFollow(position: number, followTarget: number, lineHeightPx: number): boolean {
  if (lineHeightPx <= 0) return false;
  return Math.abs(position - followTarget) > lineHeightPx * FOLLOW_BREAK_LINES;
}
