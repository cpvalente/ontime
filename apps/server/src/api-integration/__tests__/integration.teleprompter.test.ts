import { parseTeleprompterCommand } from '../integration.teleprompter.js';

describe('parseTeleprompterCommand()', () => {
  test.each([
    ['play', { type: 'play' }],
    ['pause', { type: 'pause' }],
    ['toggle', { type: 'toggle' }],
    ['next', { type: 'next' }],
    ['previous', { type: 'previous' }],
    ['top', { type: 'top' }],
    ['loaded', { type: 'loaded' }],
    [{ speed: 20 }, { type: 'speed', value: 20 }],
    [{ speed: '-20' }, { type: 'speed', value: -20 }],
    [{ speed: { by: -2 } }, { type: 'speedBy', value: -2 }],
    [{ speed: { by: '5' } }, { type: 'speedBy', value: 5 }],
    [{ scroll: 3 }, { type: 'scroll', lines: 3 }],
    [{ scroll: '-1' }, { type: 'scroll', lines: -1 }],
    [{ goto: { cue: '12' } }, { type: 'goto', target: { cue: '12' } }],
    [{ goto: { cue: 12 } }, { type: 'goto', target: { cue: '12' } }],
    [{ goto: { id: 'a1b2c3' } }, { type: 'goto', target: { id: 'a1b2c3' } }],
    [{ goto: { index: '3' } }, { type: 'goto', target: { index: 3 } }],
  ])('parses %j', (payload, command) => {
    expect(parseTeleprompterCommand(payload)).toEqual(command);
  });

  test.each([
    undefined,
    'stop',
    {},
    { speed: 'fast' },
    { speed: '' },
    { speed: null },
    { speed: { by: 'more' } },
    { scroll: 'down' },
    { goto: 'next' },
    { goto: { index: 0 } },
    { goto: { index: 1.5 } },
    { goto: { name: 'opening' } },
  ])('rejects %j', (payload) => {
    expect(() => parseTeleprompterCommand(payload)).toThrow('Invalid teleprompter command');
  });
});
