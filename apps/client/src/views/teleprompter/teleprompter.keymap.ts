import type { TeleprompterCommand } from 'ontime-utils';

export type TeleprompterViewCommand =
  | Exclude<TeleprompterCommand, { type: 'goto' }>
  | { type: 'goto'; target: 'loaded' };

export type TeleprompterKeyAction =
  | { type: 'command'; command: TeleprompterViewCommand }
  | { type: 'page'; direction: 1 | -1 };

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
      return event.repeat ? null : command({ type: 'top' });
  }

  switch (event.key) {
    case 'l':
    case 'L':
      return event.repeat ? null : command({ type: 'goto', target: 'loaded' });
    case 'm':
    case 'M':
      return event.repeat ? null : command({ type: 'mode', mode: 'toggle' });
    case 'b':
    case 'B':
      return event.repeat ? null : command({ type: 'blackout', blackout: 'toggle' });
  }

  return null;
}
