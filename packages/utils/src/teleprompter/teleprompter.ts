/** Teleprompter speed bounds, in lines per minute */
export const teleprompterSpeed = {
  min: 1,
  max: 40,
} as const;

export function clampTeleprompterSpeed(speed: number): number {
  return Math.min(Math.max(speed, teleprompterSpeed.min), teleprompterSpeed.max);
}
