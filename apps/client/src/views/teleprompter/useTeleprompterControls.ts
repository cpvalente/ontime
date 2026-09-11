import { useEffect, useRef } from 'react';

import { useViewParamsEditorStore } from '../../common/components/view-params-editor/viewParamsEditor.store';
import { resolveTeleprompterAction } from './teleprompter.keymap';
import type { TeleprompterAction, TeleprompterCommand, TeleprompterController } from './teleprompter.types';

interface TeleprompterActionContext {
  controller: TeleprompterController;
  onFlip: (axis: 'h' | 'v') => void;
  onFontSize: (steps: number) => void;
  onResetFontSize: () => void;
  onToggleHelp: () => void;
}

interface UseTeleprompterControlsArgs extends TeleprompterActionContext {
  isHelpOpen: boolean;
  enabled?: boolean;
}

const ignoredTags = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function applyTeleprompterAction(action: TeleprompterAction, context: TeleprompterActionContext) {
  const { controller, onFlip, onFontSize, onResetFontSize, onToggleHelp } = context;
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
    case 'fontSize':
      return onFontSize(action.steps);
    case 'resetFontSize':
      return onResetFontSize();
    case 'toggleHelp':
      return onToggleHelp();
  }
}

export function applyTeleprompterCommand(command: TeleprompterCommand, controller: TeleprompterController) {
  switch (command.type) {
    case 'play':
      return controller.play();
    case 'pause':
      return controller.pause();
    case 'setSpeed':
      return controller.setSpeed(command.linesPerMinute);
    case 'nudge':
      return controller.nudge(command.lines, { preserveFollow: true });
  }
}

export function useTeleprompterControls(args: UseTeleprompterControlsArgs) {
  const argsRef = useRef(args);
  useEffect(() => {
    argsRef.current = args;
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (ignoredTags.has(target.tagName) || target.isContentEditable)) {
        return;
      }
      if (useViewParamsEditorStore.getState().isOpen || argsRef.current.isHelpOpen) {
        return;
      }
      if (argsRef.current.enabled === false) return;

      const action = resolveTeleprompterAction(event);
      if (!action) return;

      event.preventDefault();
      applyTeleprompterAction(action, argsRef.current);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
