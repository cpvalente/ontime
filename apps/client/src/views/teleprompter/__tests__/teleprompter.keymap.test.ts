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

describe('CTL-2 resolveTeleprompterKey()', () => {
  test.each<[string, Partial<TeleprompterKeyEvent>, TeleprompterKeyAction]>([
    ['Space', { code: 'Space' }, { type: 'command', payload: 'toggle' }],
    ['ArrowRight', { code: 'ArrowRight' }, { type: 'command', payload: { speed: { by: 1 } } }],
    ['ArrowLeft', { code: 'ArrowLeft' }, { type: 'command', payload: { speed: { by: -1 } } }],
    ['Shift+ArrowRight', { code: 'ArrowRight', shiftKey: true }, { type: 'command', payload: { speed: { by: 5 } } }],
    ['Shift+ArrowLeft', { code: 'ArrowLeft', shiftKey: true }, { type: 'command', payload: { speed: { by: -5 } } }],
    ['ArrowDown', { code: 'ArrowDown' }, { type: 'command', payload: { scroll: 1 } }],
    ['ArrowUp', { code: 'ArrowUp' }, { type: 'command', payload: { scroll: -1 } }],
    ['PageDown', { code: 'PageDown' }, { type: 'page', direction: 1 }],
    ['PageUp', { code: 'PageUp' }, { type: 'page', direction: -1 }],
    ['Shift+ArrowDown', { code: 'ArrowDown', shiftKey: true }, { type: 'command', payload: 'next' }],
    ['Shift+ArrowUp', { code: 'ArrowUp', shiftKey: true }, { type: 'command', payload: 'previous' }],
    ['Home', { code: 'Home' }, { type: 'command', payload: 'top' }],
    ['L', { key: 'l' }, { type: 'command', payload: 'loaded' }],
    ['?', { key: '?', shiftKey: true }, { type: 'help' }],
  ])('%s', (_, event, action) => {
    expect(resolveTeleprompterKey(makeEvent(event))).toEqual(action);
  });

  test('a held arrow keeps scrolling, but a held Space does not keep toggling', () => {
    expect(resolveTeleprompterKey(makeEvent({ code: 'ArrowDown', repeat: true }))).toEqual({
      type: 'command',
      payload: { scroll: 1 },
    });
    expect(resolveTeleprompterKey(makeEvent({ code: 'Space', repeat: true }))).toBeNull();
  });

  test('never shadows a shortcut which carries a modifier', () => {
    expect(resolveTeleprompterKey(makeEvent({ key: ',', metaKey: true }))).toBeNull();
    expect(resolveTeleprompterKey(makeEvent({ code: 'Space', ctrlKey: true }))).toBeNull();
    expect(resolveTeleprompterKey(makeEvent({ code: 'ArrowRight', altKey: true }))).toBeNull();
  });

  test('leaves Enter alone, so a focused button can still be pressed', () => {
    expect(resolveTeleprompterKey(makeEvent({ code: 'Enter', key: 'Enter' }))).toBeNull();
  });
});
