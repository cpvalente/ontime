import { clampTeleprompterSpeed } from 'ontime-utils';

export type TeleprompterCommand =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'speed'; value: number }
  | { type: 'nudge'; value: number };

/**
 * Parses a teleprompter integration payload
 * - /teleprompter/play
 * - /teleprompter/pause
 * - /teleprompter/speed/{lines per minute}
 * - /teleprompter/nudge/{lines, negative scrolls back}
 * @throws if the payload is not a valid command
 */
export function parseTeleprompterCommand(payload: unknown): TeleprompterCommand {
  if (payload === 'play' || payload === 'pause') {
    return { type: payload };
  }

  if (payload && typeof payload === 'object') {
    if ('speed' in payload) {
      return { type: 'speed', value: clampTeleprompterSpeed(numberOrError(payload.speed)) };
    }
    if ('nudge' in payload) {
      return { type: 'nudge', value: numberOrError(payload.nudge) };
    }
  }

  throw new Error('Invalid teleprompter command');
}

function numberOrError(value: unknown): number {
  // values from HTTP and OSC paths arrive as strings
  const converted = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof converted !== 'number' || !Number.isFinite(converted)) {
    throw new Error('Teleprompter command value is not a valid number');
  }
  return converted;
}
