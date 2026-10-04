import { parseTeleprompterCommand } from '../integration.teleprompter.js';

describe('parseTeleprompterCommand()', () => {
  test.each([
    ['play', { type: 'play' }],
    ['pause', { type: 'pause' }],
    [{ speed: 20 }, { type: 'speed', value: 20 }],
    [{ speed: '20' }, { type: 'speed', value: 20 }],
    [{ nudge: '-3' }, { type: 'nudge', value: -3 }],
  ])('parses %j', (payload, command) => {
    expect(parseTeleprompterCommand(payload)).toEqual(command);
  });

  test('keeps the speed within what the views can scroll at', () => {
    expect(parseTeleprompterCommand({ speed: 0 })).toEqual({ type: 'speed', value: 1 });
    expect(parseTeleprompterCommand({ speed: 100 })).toEqual({ type: 'speed', value: 40 });
  });

  test.each([undefined, 'stop', {}])('rejects unknown command %j', (payload) => {
    expect(() => parseTeleprompterCommand(payload)).toThrow('Invalid teleprompter command');
  });

  test.each([{ speed: 'fast' }, { speed: '' }, { nudge: null }])('rejects invalid value %j', (payload) => {
    expect(() => parseTeleprompterCommand(payload)).toThrow('not a valid number');
  });
});
