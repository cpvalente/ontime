import { parseTeleprompterCommand } from '../integration.teleprompter.js';

describe('parseTeleprompterCommand()', () => {
  test('parses transport commands', () => {
    expect(parseTeleprompterCommand('play')).toEqual({ type: 'play' });
    expect(parseTeleprompterCommand('pause')).toEqual({ type: 'pause' });
  });

  test('parses numeric commands from numbers and strings', () => {
    expect(parseTeleprompterCommand({ speed: 20 })).toEqual({ type: 'speed', value: 20 });
    expect(parseTeleprompterCommand({ speed: '20' })).toEqual({ type: 'speed', value: 20 });
    expect(parseTeleprompterCommand({ nudge: '-3' })).toEqual({ type: 'nudge', value: -3 });
  });

  test.each([undefined, null, 'stop', {}])('rejects unknown payload %j', (payload) => {
    expect(() => parseTeleprompterCommand(payload)).toThrow('Invalid teleprompter command');
  });

  test.each([{ speed: 'fast' }, { speed: '' }, { nudge: null }, { nudge: Infinity }])(
    'rejects invalid value %j',
    (payload) => {
      expect(() => parseTeleprompterCommand(payload)).toThrow('not a valid number');
    },
  );
});
