import type { TeleprompterCommand } from 'ontime-utils';

/** What a view's keys and buttons do: they reach events by moving through them, or back to the loaded one */
export type TeleprompterViewCommand =
  | Exclude<TeleprompterCommand, { type: 'goto' }>
  | { type: 'goto'; target: 'loaded' };

export type TeleprompterKeyAction =
  | { type: 'command'; command: TeleprompterViewCommand }
  /** a screen of lines, which only the view knows */
  | { type: 'page'; direction: 1 | -1 }
  | { type: 'help' };

export type TeleprompterKeyEvent = {
  code: string;
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  repeat: boolean;
};

export const speedStep = 1;
export const coarseSpeedStep = 5;

export function resolveTeleprompterKey(event: TeleprompterKeyEvent): TeleprompterKeyAction | null {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return null;
  }

  const command = (command: TeleprompterViewCommand): TeleprompterKeyAction => ({ type: 'command', command });

  switch (event.code) {
    case 'Space':
      return event.repeat ? null : command({ type: 'toggle' });
    // Shift is the coarser step on both axes: a bigger speed change sideways,
    // a whole event rather than a line vertically.
    case 'ArrowDown':
      return command(event.shiftKey ? { type: 'next' } : { type: 'scroll', lines: 1 });
    case 'ArrowUp':
      return command(event.shiftKey ? { type: 'previous' } : { type: 'scroll', lines: -1 });
    case 'PageDown':
      return { type: 'page', direction: 1 };
    case 'PageUp':
      return { type: 'page', direction: -1 };
    case 'ArrowRight':
      return command({ type: 'speedBy', value: event.shiftKey ? coarseSpeedStep : speedStep });
    case 'ArrowLeft':
      return command({ type: 'speedBy', value: event.shiftKey ? -coarseSpeedStep : -speedStep });
    case 'Home':
      return command({ type: 'top' });
  }

  // Character bindings use key so they work across keyboard layouts.
  switch (event.key) {
    case '?':
      return { type: 'help' };
    case 'l':
    case 'L':
      return command({ type: 'goto', target: 'loaded' });
    case 'm':
    case 'M':
      return command({ type: 'mode', mode: 'toggle' });
  }

  return null;
}
