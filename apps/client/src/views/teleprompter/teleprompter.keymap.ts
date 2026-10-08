import type { ApiAction } from 'ontime-types';

/** A teleprompter command, as the integration API takes it */
export type TeleprompterPayload = Extract<ApiAction, { tag: 'teleprompter' }>['payload'];

export type TeleprompterKeyAction =
  | { type: 'command'; payload: TeleprompterPayload }
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

  const command = (payload: TeleprompterPayload): TeleprompterKeyAction => ({ type: 'command', payload });

  switch (event.code) {
    case 'Space':
      return event.repeat ? null : command('toggle');
    // Shift is the coarser step on both axes: a bigger speed change sideways,
    // a whole event rather than a line vertically.
    case 'ArrowDown':
      return command(event.shiftKey ? 'next' : { scroll: 1 });
    case 'ArrowUp':
      return command(event.shiftKey ? 'previous' : { scroll: -1 });
    case 'PageDown':
      return { type: 'page', direction: 1 };
    case 'PageUp':
      return { type: 'page', direction: -1 };
    case 'ArrowRight':
      return command({ speed: { by: event.shiftKey ? coarseSpeedStep : speedStep } });
    case 'ArrowLeft':
      return command({ speed: { by: event.shiftKey ? -coarseSpeedStep : -speedStep } });
    case 'Home':
      return command('top');
  }

  // Character bindings use key so they work across keyboard layouts.
  switch (event.key) {
    case '?':
      return { type: 'help' };
    case 'l':
    case 'L':
      return command('loaded');
  }

  return null;
}
