import { useEffect, useRef } from 'react';

import { resolveTeleprompterKey, type TeleprompterViewCommand } from './teleprompter.keymap';
import { createScrollBatcher, linesPerScreen, wheelToLines } from './teleprompter.utils';

interface UseTeleprompterInputArgs {
  screen: HTMLElement | null;
  /** where commands go, or nothing for a screen which only displays */
  onCommand?: (command: TeleprompterViewCommand) => void;
  rowHeight: number;
  /** whether the mouse wheel sends scroll commands, rather than scroll the screen by hand */
  wheel: boolean;
}

const ignoredTags = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** Form fields and select menus own their keyboard input. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    ignoredTags.has(target.tagName) ||
    target.isContentEditable ||
    target.closest('[role="combobox"], [role="listbox"]') !== null
  );
}

/** The params drawer, the navigation menu and the shortcut list are dialogs, which own the input while open */
export function isDialogOpen(): boolean {
  return document.querySelector('[role="dialog"]') !== null;
}

/** Turns the keyboard and the mouse wheel into teleprompter commands */
export function useTeleprompterInput(args: UseTeleprompterInputArgs) {
  const latest = useRef(args);
  // keeps the latest values for the listeners, which are registered once
  useEffect(() => {
    latest.current = args;
  });

  const { screen, wheel } = args;
  const hasCommands = Boolean(args.onCommand);

  // maps keyboard shortcuts to commands
  useEffect(() => {
    if (!hasCommands) return;

    function handleKeyDown(event: KeyboardEvent) {
      const { onCommand, rowHeight } = latest.current;
      if (!onCommand || isDialogOpen()) return;
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

  // sends the mouse wheel, and scroll controllers which act as one, as grouped scroll commands
  useEffect(() => {
    if (!screen || !hasCommands || !wheel) return;

    const batcher = createScrollBatcher((lines) => latest.current.onCommand?.({ type: 'scroll', lines }));
    function handleWheel(event: WheelEvent) {
      const { rowHeight } = latest.current;
      if (isDialogOpen()) return;
      const screenLines = linesPerScreen(window.innerHeight, rowHeight);
      const lines = wheelToLines(event.deltaY, event.deltaMode, rowHeight, screenLines);
      if (lines !== 0) batcher.add(lines);
    }

    screen.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      screen.removeEventListener('wheel', handleWheel);
      batcher.dispose();
    };
  }, [screen, hasCommands, wheel]);
}
