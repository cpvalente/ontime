import { resolveTeleprompterAction, type TeleprompterKeyEvent } from '../teleprompter.keymap';
import { SPEED_STEP, SPEED_STEP_COARSE } from '../teleprompter.scroll';

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
  test('space toggles playback', () => {
    expect(resolveTeleprompterAction(makeEvent({ code: 'Space' }))).toEqual({ type: 'togglePlay' });
  });

  test('ignores a repeating space', () => {
    expect(resolveTeleprompterAction(makeEvent({ code: 'Space', repeat: true }))).toBeNull();
  });

  test('vertical arrows nudge by a line', () => {
    expect(resolveTeleprompterAction(makeEvent({ code: 'ArrowDown' }))).toEqual({ type: 'nudge', lines: 1 });
    expect(resolveTeleprompterAction(makeEvent({ code: 'ArrowUp' }))).toEqual({ type: 'nudge', lines: -1 });
  });

  test('a repeating arrow still nudges, so the key can be held', () => {
    expect(resolveTeleprompterAction(makeEvent({ code: 'ArrowDown', repeat: true }))).toEqual({
      type: 'nudge',
      lines: 1,
    });
  });

  test('shift makes the vertical arrows jump a whole event', () => {
    expect(resolveTeleprompterAction(makeEvent({ code: 'ArrowDown', shiftKey: true }))).toEqual({
      type: 'jumpEvent',
      direction: 1,
    });
    expect(resolveTeleprompterAction(makeEvent({ code: 'ArrowUp', shiftKey: true }))).toEqual({
      type: 'jumpEvent',
      direction: -1,
    });
  });

  test('page keys jump a screen', () => {
    expect(resolveTeleprompterAction(makeEvent({ code: 'PageDown' }))).toEqual({ type: 'page', direction: 1 });
    expect(resolveTeleprompterAction(makeEvent({ code: 'PageUp' }))).toEqual({ type: 'page', direction: -1 });
  });

  test('horizontal arrows change speed', () => {
    expect(resolveTeleprompterAction(makeEvent({ code: 'ArrowRight' }))).toEqual({ type: 'speed', delta: SPEED_STEP });
    expect(resolveTeleprompterAction(makeEvent({ code: 'ArrowLeft' }))).toEqual({ type: 'speed', delta: -SPEED_STEP });
  });

  test('shift makes the speed step coarse', () => {
    expect(resolveTeleprompterAction(makeEvent({ code: 'ArrowRight', shiftKey: true }))).toEqual({
      type: 'speed',
      delta: SPEED_STEP_COARSE,
    });
    expect(resolveTeleprompterAction(makeEvent({ code: 'ArrowLeft', shiftKey: true }))).toEqual({
      type: 'speed',
      delta: -SPEED_STEP_COARSE,
    });
  });

  test('home rewinds and escape rewinds and stops', () => {
    expect(resolveTeleprompterAction(makeEvent({ code: 'Home' }))).toEqual({ type: 'rewind' });
    expect(resolveTeleprompterAction(makeEvent({ code: 'Escape' }))).toEqual({ type: 'rewindAndPause' });
    expect(resolveTeleprompterAction(makeEvent({ code: 'End' }))).toEqual({ type: 'jumpToEnd' });
  });

  test('f flips, shift+f flips the other axis', () => {
    expect(resolveTeleprompterAction(makeEvent({ key: 'f' }))).toEqual({ type: 'flip', axis: 'h' });
    expect(resolveTeleprompterAction(makeEvent({ key: 'F', shiftKey: true }))).toEqual({ type: 'flip', axis: 'v' });
  });

  test('changes and resets the font size', () => {
    expect(resolveTeleprompterAction(makeEvent({ key: '+' }))).toEqual({ type: 'fontSize', steps: 1 });
    expect(resolveTeleprompterAction(makeEvent({ key: '=' }))).toEqual({ type: 'fontSize', steps: 1 });
    expect(resolveTeleprompterAction(makeEvent({ key: '-' }))).toEqual({ type: 'fontSize', steps: -1 });
    expect(resolveTeleprompterAction(makeEvent({ key: '_' }))).toEqual({ type: 'fontSize', steps: -1 });
    expect(resolveTeleprompterAction(makeEvent({ key: '0' }))).toEqual({ type: 'resetFontSize' });
  });

  test('l re-engages the follow and ? shows the help', () => {
    expect(resolveTeleprompterAction(makeEvent({ key: 'l' }))).toEqual({ type: 'reengageFollow' });
    expect(resolveTeleprompterAction(makeEvent({ key: '?', shiftKey: true }))).toEqual({ type: 'toggleHelp' });
  });

  test('never shadows a shortcut which carries a modifier', () => {
    expect(resolveTeleprompterAction(makeEvent({ key: ',', metaKey: true }))).toBeNull();
    expect(resolveTeleprompterAction(makeEvent({ code: 'Space', ctrlKey: true }))).toBeNull();
    expect(resolveTeleprompterAction(makeEvent({ code: 'ArrowRight', altKey: true }))).toBeNull();
  });

  test('ignores keys it does not bind', () => {
    expect(resolveTeleprompterAction(makeEvent({ code: 'KeyQ', key: 'q' }))).toBeNull();
  });

  test('leaves Enter alone, so a focused transport button can still be pressed', () => {
    expect(resolveTeleprompterAction(makeEvent({ code: 'Enter', key: 'Enter' }))).toBeNull();
  });
});
