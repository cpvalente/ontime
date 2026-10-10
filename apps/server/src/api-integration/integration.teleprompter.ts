import type { TeleprompterRequest } from '../services/teleprompter-service/teleprompter.service.js';

const simpleCommands = ['play', 'pause', 'toggle', 'next', 'previous', 'top', 'loaded'] as const;

const invalidCommand = 'Invalid teleprompter command';

/**
 * Parses a teleprompter integration payload
 * - /teleprompter/{play | pause | toggle | next | previous | top | loaded}
 * - /teleprompter/speed/{lines per minute}
 * - /teleprompter/speed/by/{lines per minute}
 * - /teleprompter/scroll/{lines}
 * - /teleprompter/goto/{cue | id | index}/{value}
 * @throws if the payload is not a valid command
 */
export function parseTeleprompterCommand(payload: unknown): TeleprompterRequest {
  const simple = simpleCommands.find((command) => command === payload);
  if (simple) return { type: simple };

  if (!payload || typeof payload !== 'object') throw new Error(invalidCommand);

  if ('speed' in payload) {
    const { speed } = payload;
    if (speed && typeof speed === 'object' && 'by' in speed) return { type: 'speedBy', value: toNumber(speed.by) };
    return { type: 'speed', value: toNumber(speed) };
  }

  if ('scroll' in payload) return { type: 'scroll', lines: toNumber(payload.scroll) };

  if ('goto' in payload && payload.goto && typeof payload.goto === 'object') {
    const { goto } = payload;
    if ('cue' in goto && (typeof goto.cue === 'string' || typeof goto.cue === 'number')) {
      return { type: 'goto', target: { cue: String(goto.cue) } };
    }
    if ('id' in goto && typeof goto.id === 'string') return { type: 'goto', target: { id: goto.id } };
    if ('index' in goto) {
      const index = toNumber(goto.index);
      if (Number.isInteger(index) && index > 0) return { type: 'goto', target: { index } };
    }
  }

  throw new Error(invalidCommand);
}

function toNumber(value: unknown): number {
  // values from HTTP and OSC paths arrive as strings
  const converted = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof converted !== 'number' || !Number.isFinite(converted)) throw new Error(invalidCommand);
  return converted;
}
