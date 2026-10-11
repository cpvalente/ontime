import { useEffect, useRef } from 'react';

import { resolveTeleprompterKey, type TeleprompterViewCommand } from './teleprompter.keymap';
import { linesPerScreen } from './teleprompter.utils';

interface UseTeleprompterInputArgs {
  /** where commands go, or nothing for a screen which only displays */
  onCommand?: (command: TeleprompterViewCommand) => void;
  rowHeight: number;
}

const ignoredTags = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** Keys pressed while typing in a field belong to the field */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return ignoredTags.has(target.tagName) || target.isContentEditable;
}

/** Turns the keyboard into teleprompter commands */
export function useTeleprompterInput(args: UseTeleprompterInputArgs) {
  const latest = useRef(args);
  // keeps the latest values for the listeners, which are registered once
  useEffect(() => {
    latest.current = args;
  });

  const hasCommands = Boolean(args.onCommand);

  // maps keyboard shortcuts to commands
  useEffect(() => {
    if (!hasCommands) return;

    function handleKeyDown(event: KeyboardEvent) {
      const { onCommand, rowHeight } = latest.current;
      // the params drawer, the navigation menu and the shortcut list are dialogs, which own the keys while open
      if (!onCommand || document.querySelector('[role="dialog"]')) return;
      // Space always plays and pauses, even with a button focused: a key in a studio does one thing
      if (isTypingTarget(event.target)) return;

      const action = resolveTeleprompterKey(event);
      if (!action) return;

      event.preventDefault();
      if (action.type === 'page') {
        onCommand({ type: 'scroll', lines: action.direction * linesPerScreen(window.innerHeight, rowHeight) });
      } else {
        onCommand(action.command);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasCommands]);
}
