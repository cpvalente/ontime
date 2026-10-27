import type { TeleprompterMode, TeleprompterState } from 'ontime-types';
import { type MouseEvent, type PropsWithChildren, useState } from 'react';
import {
  IoAdd,
  IoHelpCircleOutline,
  IoLocate,
  IoPause,
  IoPlay,
  IoPlaySkipBack,
  IoPlaySkipForward,
  IoRemove,
} from 'react-icons/io5';

import Button from '../../../common/components/buttons/Button';
import IconButton from '../../../common/components/buttons/IconButton';
import Select from '../../../common/components/select/Select';
import Tooltip from '../../../common/components/tooltip/Tooltip';
import { useFadeOutOnInactivity } from '../../../common/hooks/useFadeOutOnInactivity';
import { cx } from '../../../common/utils/styleUtils';
import { speedStep, type TeleprompterViewCommand } from '../teleprompter.keymap';
import { modeLabels } from '../teleprompter.options';

/** The event Ontime has loaded, as the teleprompter script names it */
export type LoadedEvent = { id: string; cue: string; title: string; inScript: boolean };

interface ControlOverlayProps {
  state: TeleprompterState;
  loadedEvent: LoadedEvent | null;
  onCommand: (command: TeleprompterViewCommand) => void;
  onToggleHelp: () => void;
}

interface ControlButtonProps {
  label: string;
  accessibleLabel: string;
  onPress: () => void;
  testId?: string;
  disabled?: boolean;
}

// Pointer activation yields focus, so nothing is left focused for a later key to press.
function blurOnPointer(event: MouseEvent<HTMLButtonElement>) {
  if (event.detail > 0) event.currentTarget.blur();
}

// A menu closed with the pointer leaves nothing focused either, so the keys and the fading bar keep working.
function focusAfterKeyboard(closeType: string) {
  return closeType === 'keyboard';
}

function ControlButton({
  label,
  accessibleLabel,
  onPress,
  testId,
  disabled,
  children,
}: PropsWithChildren<ControlButtonProps>) {
  return (
    <Tooltip
      text={label}
      render={
        <IconButton
          variant='subtle-white'
          size='large'
          onClick={(event) => {
            if (disabled) return;
            blurOnPointer(event);
            onPress();
          }}
          // Keep unavailable actions focusable so their tooltip can explain why.
          aria-disabled={disabled || undefined}
          className={disabled ? 'teleprompter__control--disabled' : undefined}
          data-testid={testId}
          aria-label={accessibleLabel}
        />
      }
    >
      {children}
    </Tooltip>
  );
}

/** Playback controls fade while idle and remain visible while hovered or focused. */
export default function ControlOverlay({ state, loadedEvent, onCommand, onToggleHelp }: ControlOverlayProps) {
  const isActive = useFadeOutOnInactivity(true);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const isVisible = isActive || isHovered || hasFocus;
  const isPlaying = state.playback === 'play';
  const canGoToLoaded = loadedEvent !== null && loadedEvent.inScript && state.event?.id !== loadedEvent.id;
  const loadedLabel = getGoToLoadedLabel(loadedEvent, canGoToLoaded);
  const loadedName = loadedEvent?.cue || loadedEvent?.title;

  return (
    <div
      className={cx(['teleprompter__controls', !isVisible && 'teleprompter__controls--idle'])}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onFocus={() => setHasFocus(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false);
      }}
      data-testid='teleprompter-controls'
    >
      <div className='teleprompter__group' role='group' aria-label='Transport'>
        <Button
          className='teleprompter__play'
          variant={isPlaying ? 'primary' : 'subtle-white'}
          size='large'
          aria-pressed={isPlaying}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          onClick={(event) => {
            blurOnPointer(event);
            onCommand({ type: 'toggle' });
          }}
          data-testid='teleprompter-play'
        >
          {isPlaying ? <IoPause /> : <IoPlay />}
        </Button>
        <ControlButton
          label='Previous event (Shift + Up arrow)'
          accessibleLabel='Previous event'
          onPress={() => onCommand({ type: 'previous' })}
          testId='teleprompter-previous'
        >
          <IoPlaySkipBack />
        </ControlButton>
        <ControlButton
          label='Next event (Shift + Down arrow)'
          accessibleLabel='Next event'
          onPress={() => onCommand({ type: 'next' })}
          testId='teleprompter-next'
        >
          <IoPlaySkipForward />
        </ControlButton>
        <ControlButton
          label={loadedName ? `${loadedLabel}: ${loadedName} (L)` : loadedLabel}
          accessibleLabel='Go to loaded event'
          disabled={!canGoToLoaded}
          onPress={() => onCommand({ type: 'goto', target: 'loaded' })}
          testId='teleprompter-loaded'
        >
          <IoLocate />
        </ControlButton>
      </div>

      <div className='teleprompter__mode' data-testid='teleprompter-playback-mode'>
        <Select<TeleprompterMode>
          aria-label='Playback mode'
          size='large'
          finalFocus={focusAfterKeyboard}
          value={state.mode}
          onValueChange={(mode) => {
            if (mode) onCommand({ type: 'mode', mode });
          }}
          options={[
            { value: 'event', label: modeLabels.event },
            { value: 'script', label: modeLabels.script },
          ]}
        />
      </div>

      <div className='teleprompter__speed-control' role='group' aria-label='Speed'>
        <ControlButton
          label='Slower (Left arrow)'
          accessibleLabel='Slower'
          onPress={() => onCommand({ type: 'speedBy', value: -speedStep })}
          testId='teleprompter-slower'
        >
          <IoRemove />
        </ControlButton>
        <div className='teleprompter__speed' data-testid='teleprompter-speed'>
          {state.speed}
          <span className='teleprompter__speed-unit'>lpm</span>
        </div>
        <ControlButton
          label='Faster (Right arrow)'
          accessibleLabel='Faster'
          onPress={() => onCommand({ type: 'speedBy', value: speedStep })}
          testId='teleprompter-faster'
        >
          <IoAdd />
        </ControlButton>
      </div>
      <ControlButton label='Keyboard shortcuts (?)' accessibleLabel='Keyboard shortcuts' onPress={onToggleHelp}>
        <IoHelpCircleOutline />
      </ControlButton>
    </div>
  );
}

function getGoToLoadedLabel(loadedEvent: LoadedEvent | null, canGoToLoaded: boolean): string {
  if (!loadedEvent) return 'No event loaded';
  if (!loadedEvent.inScript) return 'Loaded event has no script';
  return canGoToLoaded ? 'Go to loaded event' : 'At loaded event';
}
