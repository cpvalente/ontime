import { useEffect, useRef } from 'react';

import { useViewParamsEditorStore } from '../../common/components/view-params-editor/viewParamsEditor.store';
import { resolveTeleprompterKey, type TeleprompterPayload } from './teleprompter.keymap';
import { createScrollBatcher, linesPerScreen, wheelToLines } from './teleprompter.utils';

interface UseTeleprompterInputArgs {
  screen: HTMLElement | null;
  /** where commands go, or nothing for a screen which only displays */
  onCommand?: (payload: TeleprompterPayload) => void;
  rowHeight: number;
  /** whether the mouse wheel sends scroll commands */
  wheel: boolean;
  disabled: boolean;
}

const ignoredTags = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

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
      const { onCommand, rowHeight, disabled } = latest.current;
      const target = event.target as HTMLElement | null;
      if (!onCommand || disabled || useViewParamsEditorStore.getState().isOpen) return;
      if (target && (ignoredTags.has(target.tagName) || target.isContentEditable)) return;
      // a button focused from the keyboard takes Space as a press
      if (event.code === 'Space' && target?.closest('button')) return;

      const action = resolveTeleprompterKey(event);
      if (!action) return;

      event.preventDefault();
      if (action.type === 'page') {
        onCommand({ scroll: action.direction * linesPerScreen(window.innerHeight, rowHeight) });
      } else {
        onCommand(action.payload);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasCommands]);

  // sends the mouse wheel, and scroll controllers which act as one, as grouped scroll commands
  useEffect(() => {
    if (!screen || !hasCommands || !wheel) return;

    const batcher = createScrollBatcher((lines) => latest.current.onCommand?.({ scroll: lines }));
    function handleWheel(event: WheelEvent) {
      const { rowHeight, disabled } = latest.current;
      if (disabled) return;
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
