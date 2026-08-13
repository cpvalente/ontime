import { useEffect, useRef } from 'react';

import { useViewParamsEditorStore } from '../../common/components/view-params-editor/viewParamsEditor.store';
import { resolveTeleprompterAction } from './teleprompter.keymap';
import type { TeleprompterAction, TeleprompterController } from './teleprompter.types';

interface UseTeleprompterControlsArgs {
  controller: TeleprompterController;
  isHelpOpen: boolean;
  onFlip: (axis: 'h' | 'v') => void;
  onFontSize: (steps: number) => void;
  onResetFontSize: () => void;
  onToggleHelp: () => void;
}

const ignoredTags = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function useTeleprompterControls(args: UseTeleprompterControlsArgs) {
  const argsRef = useRef(args);
  useEffect(() => {
    argsRef.current = args;
  });

  useEffect(() => {
    function applyAction(action: TeleprompterAction) {
      const { controller, onFlip, onFontSize, onResetFontSize, onToggleHelp } = argsRef.current;
      switch (action.type) {
        case 'togglePlay':
          return controller.togglePlay();
        case 'nudge':
          return controller.nudge(action.lines);
        case 'page':
          return controller.page(action.direction);
        case 'speed':
          return controller.changeSpeed(action.delta);
        case 'rewind':
          return controller.rewind();
        case 'rewindAndPause':
          return controller.rewind(true);
        case 'jumpToEnd':
          return controller.jumpToEnd();
        case 'reengageFollow':
          return controller.reengageFollow();
        case 'flip':
          return onFlip(action.axis);
        case 'fontSize':
          return onFontSize(action.steps);
        case 'resetFontSize':
          return onResetFontSize();
        case 'toggleHelp':
          return onToggleHelp();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (ignoredTags.has(target.tagName) || target.isContentEditable)) {
        return;
      }
      if (useViewParamsEditorStore.getState().isOpen || argsRef.current.isHelpOpen) {
        return;
      }

      const action = resolveTeleprompterAction(event);
      if (!action) return;

      event.preventDefault();
      applyAction(action);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
