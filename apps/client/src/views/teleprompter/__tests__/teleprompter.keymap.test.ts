import { resolveTeleprompterAction, type TeleprompterKeyEvent } from '../teleprompter.keymap';
import { SPEED_STEP, SPEED_STEP_COARSE } from '../teleprompter.scroll';
import type { TeleprompterAction } from '../teleprompter.types';

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

describe('resolveTeleprompterAction()', () => {
  test.each<[string, Partial<TeleprompterKeyEvent>, TeleprompterAction]>([
    ['Space', { code: 'Space' }, { type: 'togglePlay' }],
    ['ArrowDown', { code: 'ArrowDown' }, { type: 'nudge', lines: 1 }],
    ['ArrowUp', { code: 'ArrowUp' }, { type: 'nudge', lines: -1 }],
    ['Shift+ArrowDown', { code: 'ArrowDown', shiftKey: true }, { type: 'jumpEvent', direction: 1 }],
    ['Shift+ArrowUp', { code: 'ArrowUp', shiftKey: true }, { type: 'jumpEvent', direction: -1 }],
    ['PageDown', { code: 'PageDown' }, { type: 'page', direction: 1 }],
    ['PageUp', { code: 'PageUp' }, { type: 'page', direction: -1 }],
    ['ArrowRight', { code: 'ArrowRight' }, { type: 'speed', delta: SPEED_STEP }],
    ['ArrowLeft', { code: 'ArrowLeft' }, { type: 'speed', delta: -SPEED_STEP }],
    ['Shift+ArrowRight', { code: 'ArrowRight', shiftKey: true }, { type: 'speed', delta: SPEED_STEP_COARSE }],
    ['Shift+ArrowLeft', { code: 'ArrowLeft', shiftKey: true }, { type: 'speed', delta: -SPEED_STEP_COARSE }],
    ['Home', { code: 'Home' }, { type: 'rewind' }],
    ['End', { code: 'End' }, { type: 'jumpToEnd' }],
    ['Escape', { code: 'Escape' }, { type: 'rewindAndPause' }],
    ['L', { key: 'l' }, { type: 'reengageFollow' }],
    ['?', { key: '?', shiftKey: true }, { type: 'toggleHelp' }],
  ])('%s', (_, event, action) => {
    expect(resolveTeleprompterAction(makeEvent(event))).toEqual(action);
  });

  test('a held arrow keeps nudging, but a held Space does not keep toggling', () => {
    expect(resolveTeleprompterAction(makeEvent({ code: 'ArrowDown', repeat: true }))).toEqual({
      type: 'nudge',
      lines: 1,
    });
    expect(resolveTeleprompterAction(makeEvent({ code: 'Space', repeat: true }))).toBeNull();
  });

  test('never shadows a shortcut which carries a modifier', () => {
    expect(resolveTeleprompterAction(makeEvent({ key: ',', metaKey: true }))).toBeNull();
    expect(resolveTeleprompterAction(makeEvent({ code: 'Space', ctrlKey: true }))).toBeNull();
    expect(resolveTeleprompterAction(makeEvent({ code: 'ArrowRight', altKey: true }))).toBeNull();
  });

  test('leaves Enter alone, so a focused button can still be pressed', () => {
    expect(resolveTeleprompterAction(makeEvent({ code: 'Enter', key: 'Enter' }))).toBeNull();
  });
});
