import { parseTeleprompterCommand } from '../integration.teleprompter.js';

describe('parseTeleprompterCommand()', () => {
  describe('the four controls of a media player', () => {
    test.each([
      ['next', { type: 'next' }],
      ['previous', { type: 'previous' }],
      ['top', { type: 'top' }],
      [{ goto: { cue: 12 } }, { type: 'goto', target: { cue: '12' } }],
      [{ goto: { id: 'a1b2c3' } }, { type: 'goto', target: { id: 'a1b2c3' } }],
      [{ goto: { index: '3' } }, { type: 'goto', target: { index: 3 } }],
      [{ goto: 'loaded' }, { type: 'goto', target: 'loaded' }],
    ])('jumps between events with %j', (payload, command) => {
      expect(parseTeleprompterCommand(payload)).toEqual(command);
    });

    test.each([
      ['play', { type: 'play' }],
      ['pause', { type: 'pause' }],
      ['toggle', { type: 'toggle' }],
    ])('starts and pauses with %j', (payload, command) => {
      expect(parseTeleprompterCommand(payload)).toEqual(command);
    });

    test.each([
      [{ speed: 20 }, { type: 'speed', value: 20 }],
      [{ speed: '-20' }, { type: 'speed', value: -20 }],
      [{ speed: { by: -2 } }, { type: 'speedBy', value: -2 }],
    ])('sets the speed with %j', (payload, command) => {
      expect(parseTeleprompterCommand(payload)).toEqual(command);
    });

    test('nudges by lines', () => {
      expect(parseTeleprompterCommand({ scroll: '-1' })).toEqual({ type: 'scroll', lines: -1 });
    });
  });

  test.each([
    [{ mode: 'script' }, { type: 'mode', mode: 'script' }],
    [{ mode: 'toggle' }, { type: 'mode', mode: 'toggle' }],
  ])('controller views set the mode with %j', (payload, command) => {
    expect(parseTeleprompterCommand(payload)).toEqual(command);
  });

  test.each([
    undefined,
    'stop',
    'loaded',
    {},
    { speed: 'fast' },
    { speed: '' },
    { scroll: 'down' },
    { mode: 'free' },
    { goto: 'next' },
    { goto: { index: 0 } },
    { goto: { name: 'opening' } },
  ])('rejects %j', (payload) => {
    expect(() => parseTeleprompterCommand(payload)).toThrow('Invalid teleprompter command');
  });
});
