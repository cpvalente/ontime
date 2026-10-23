import { resolveTeleprompterKey, type TeleprompterKeyAction, type TeleprompterKeyEvent } from '../teleprompter.keymap';

function makeEvent(overrides: Partial<TeleprompterKeyEvent>): TeleprompterKeyEvent {
  return {
    code: '',
    key: '',
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    repeat: false,
    ...overrides,
  };
}

describe('resolveTeleprompterKey()', () => {
  test.each<[string, Partial<TeleprompterKeyEvent>, TeleprompterKeyAction]>([
    ['Space', { code: 'Space' }, { type: 'command', command: { type: 'toggle' } }],
    ['ArrowDown', { code: 'ArrowDown' }, { type: 'command', command: { type: 'scroll', lines: 1 } }],
    ['Shift+ArrowDown', { code: 'ArrowDown', shiftKey: true }, { type: 'command', command: { type: 'next' } }],
    [
      'Shift+ArrowLeft',
      { code: 'ArrowLeft', shiftKey: true },
      { type: 'command', command: { type: 'speedBy', value: -5 } },
    ],
    ['PageDown', { code: 'PageDown' }, { type: 'page', direction: 1 }],
    ['L', { key: 'l' }, { type: 'command', command: { type: 'goto', target: 'loaded' } }],
    ['M', { key: 'm' }, { type: 'command', command: { type: 'mode', mode: 'toggle' } }],
  ])('%s', (_, event, action) => {
    expect(resolveTeleprompterKey(makeEvent(event))).toEqual(action);
  });

  test('a held arrow keeps scrolling, but a held Space does not keep toggling', () => {
    expect(resolveTeleprompterKey(makeEvent({ code: 'ArrowDown', repeat: true }))).toEqual({
      type: 'command',
      command: { type: 'scroll', lines: 1 },
    });
    expect(resolveTeleprompterKey(makeEvent({ code: 'Space', repeat: true }))).toBeNull();
  });

  test('never shadows a shortcut which carries a modifier', () => {
    expect(resolveTeleprompterKey(makeEvent({ code: 'Space', ctrlKey: true }))).toBeNull();
    expect(resolveTeleprompterKey(makeEvent({ code: 'ArrowRight', altKey: true }))).toBeNull();
  });
});
