import type { TeleprompterCommand } from 'ontime-utils';

const simpleCommands = ['play', 'pause', 'toggle', 'next', 'previous', 'top'] as const;

const invalidCommand = 'Invalid teleprompter command';

/**
 * Parses a teleprompter integration payload
 * Integrations drive it like a media player, with four controls:
 * - jump between events: /teleprompter/{next | previous | top}, /teleprompter/goto/{cue | id | index}/{value}
 *   with an index counting the events of the script from 1, and /teleprompter/goto/loaded
 * - start and pause: /teleprompter/{play | pause | toggle}
 * - speed: /teleprompter/speed/{lines per minute}, /teleprompter/speed/by/{lines per minute}
 * - nudge: /teleprompter/scroll/{lines}
 *
 * The mode is an operator setting, which controller views switch:
 * - /teleprompter/mode/{event | script | toggle}, to stop at the end of each event or read the whole script
 * @throws if the payload is not a valid command
 */
export function parseTeleprompterCommand(payload: unknown): TeleprompterCommand {
  const simple = simpleCommands.find((command) => command === payload);
  if (simple) return { type: simple };

  if (!payload || typeof payload !== 'object') throw new Error(invalidCommand);

  if ('speed' in payload) {
    const { speed } = payload;
    if (speed && typeof speed === 'object' && 'by' in speed) return { type: 'speedBy', value: toNumber(speed.by) };
    return { type: 'speed', value: toNumber(speed) };
  }

  if ('scroll' in payload) return { type: 'scroll', lines: toNumber(payload.scroll) };

  if ('mode' in payload && (payload.mode === 'event' || payload.mode === 'script' || payload.mode === 'toggle')) {
    return { type: 'mode', mode: payload.mode };
  }

  if ('goto' in payload && payload.goto === 'loaded') return { type: 'goto', target: 'loaded' };

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
