import { useEffect, useRef } from 'react';

import { useViewParamsEditorStore } from '../../common/components/view-params-editor/viewParamsEditor.store';
import { resolveTeleprompterAction } from './teleprompter.keymap';
import type { TeleprompterAction, TeleprompterController } from './teleprompter.types';

interface TeleprompterActionContext {
  controller: TeleprompterController;
  onFlip: (axis: 'h' | 'v') => void;
  onTextSize: (steps: number) => void;
  onResetTextSize: () => void;
  onToggleHelp: () => void;
}

interface UseTeleprompterControlsArgs extends TeleprompterActionContext {
  isHelpOpen: boolean;
}

const ignoredTags = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function applyTeleprompterAction(action: TeleprompterAction, context: TeleprompterActionContext) {
  const { controller, onFlip, onTextSize, onResetTextSize, onToggleHelp } = context;
  switch (action.type) {
    case 'togglePlay':
      return controller.togglePlay();
    case 'nudge':
      return controller.nudge(action.lines);
    case 'page':
      return controller.page(action.direction);
    case 'jumpEvent':
      return controller.jumpEvent(action.direction);
    case 'speed':
      return controller.changeSpeed(action.delta);
    case 'rewind':
      return controller.rewind();
    case 'rewindAndPause':
      controller.rewind();
      return controller.pause();
    case 'jumpToEnd':
      return controller.jumpToEnd();
    case 'reengageFollow':
      return controller.reengageFollow();
    case 'flip':
      return onFlip(action.axis);
    case 'textSize':
      return onTextSize(action.steps);
    case 'resetTextSize':
      return onResetTextSize();
    case 'toggleHelp':
      return onToggleHelp();
  }
}

export function useTeleprompterControls(args: UseTeleprompterControlsArgs) {
  const argsRef = useRef(args);
  // keeps the latest handlers for the listener, which is registered once
  useEffect(() => {
    argsRef.current = args;
  });

  // maps keyboard shortcuts to teleprompter actions
  useEffect(() => {
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
      applyTeleprompterAction(action, argsRef.current);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
