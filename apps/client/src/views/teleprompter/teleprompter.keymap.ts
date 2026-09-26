import { SPEED_STEP, SPEED_STEP_COARSE } from './teleprompter.scroll';
import type { TeleprompterAction } from './teleprompter.types';

export type TeleprompterKeyEvent = {
  code: string;
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  repeat: boolean;
};

export function resolveTeleprompterAction(event: TeleprompterKeyEvent): TeleprompterAction | null {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return null;
  }

  switch (event.code) {
    case 'Space':
      return event.repeat ? null : { type: 'togglePlay' };
    // Shift is the coarser step on both axes: a bigger speed change sideways,
    // a whole event rather than a line vertically.
    case 'ArrowDown':
      return event.shiftKey ? { type: 'jumpEvent', direction: 1 } : { type: 'nudge', lines: 1 };
    case 'ArrowUp':
      return event.shiftKey ? { type: 'jumpEvent', direction: -1 } : { type: 'nudge', lines: -1 };
    case 'PageDown':
      return { type: 'page', direction: 1 };
    case 'PageUp':
      return { type: 'page', direction: -1 };
    case 'ArrowRight':
      return { type: 'speed', delta: event.shiftKey ? SPEED_STEP_COARSE : SPEED_STEP };
    case 'ArrowLeft':
      return { type: 'speed', delta: event.shiftKey ? -SPEED_STEP_COARSE : -SPEED_STEP };
    case 'Home':
      return { type: 'rewind' };
    case 'End':
      return { type: 'jumpToEnd' };
    case 'Escape':
      return { type: 'rewindAndPause' };
  }

  // Character bindings use key so they work across keyboard layouts.
  switch (event.key) {
    case '?':
      return { type: 'toggleHelp' };
    case '+':
    case '=':
      return { type: 'fontSize', steps: 1 };
    case '-':
    case '_':
      return { type: 'fontSize', steps: -1 };
    case '0':
      return { type: 'resetFontSize' };
  }

  const lowerKey = event.key.toLowerCase();
  if (lowerKey === 'f') {
    return { type: 'flip', axis: event.shiftKey ? 'v' : 'h' };
  }
  if (lowerKey === 'l') {
    return { type: 'reengageFollow' };
  }

  return null;
}
