import type { TeleprompterState } from 'ontime-types';
import { type MouseEvent, type PropsWithChildren, useState } from 'react';
import {
  IoAdd,
  IoHelpCircleOutline,
  IoPause,
  IoPlay,
  IoPlaySkipBack,
  IoPlaySkipForward,
  IoRemove,
} from 'react-icons/io5';

import Button from '../../../common/components/buttons/Button';
import IconButton from '../../../common/components/buttons/IconButton';
import Tooltip from '../../../common/components/tooltip/Tooltip';
import { useFadeOutOnInactivity } from '../../../common/hooks/useFadeOutOnInactivity';
import { cx } from '../../../common/utils/styleUtils';
import { speedStep, type TeleprompterViewCommand } from '../teleprompter.keymap';
import { modeLabels, roleLabels, type TeleprompterRole } from '../teleprompter.options';

/** The event Ontime has loaded, as the teleprompter script names it */
export type LoadedEvent = { id: string; cue: string; title: string; inScript: boolean };

interface ControlOverlayProps {
  role: TeleprompterRole;
  state: TeleprompterState;
  loadedEvent: LoadedEvent | null;
  /** where the buttons send commands, or nothing for a screen which only displays */
  onCommand?: (command: TeleprompterViewCommand) => void;
  onToggleHelp: () => void;
}

interface ControlButtonProps {
  label: string;
  accessibleLabel: string;
  onPress: () => void;
  disabled?: boolean;
  testId?: string;
}

// Pointer activation yields focus, so nothing is left focused for a later key to press.
function blurOnPointer(event: MouseEvent<HTMLButtonElement>) {
  if (event.detail > 0) event.currentTarget.blur();
}

function ControlButton({
  label,
  accessibleLabel,
  onPress,
  disabled,
  testId,
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
            blurOnPointer(event);
            onPress();
          }}
          disabled={disabled}
          data-testid={testId}
          aria-label={accessibleLabel}
        />
      }
    >
      {children}
    </Tooltip>
  );
}

/**
 * The transport controls
 * Play / pause is a toggle and shows its state, every other button triggers a single move
 * The bar fades when the pointer is idle, but never while the pointer is over it
 */
export default function ControlOverlay({ role, state, loadedEvent, onCommand, onToggleHelp }: ControlOverlayProps) {
  const isActive = useFadeOutOnInactivity(true);
  const [isHovered, setIsHovered] = useState(false);
  const isVisible = isActive || isHovered;

  // the button would move the reader only when they are away from the loaded event
  const modeLabel = modeLabels[state.mode];
  const isPlaying = state.playback === 'play';
  const canGoToLoaded = loadedEvent !== null && loadedEvent.inScript && state.event?.id !== loadedEvent.id;

  return (
    <div
      className={cx(['teleprompter__controls', !isVisible && 'teleprompter__controls--idle'])}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      data-testid='teleprompter-controls'
    >
      <div className='teleprompter__mode'>
        <span className='teleprompter__role' data-testid='teleprompter-role'>
          {roleLabels[role]}
        </span>
        {onCommand ? (
          <button
            type='button'
            className='teleprompter__playback-mode teleprompter__playback-mode--toggle'
            title={`Switch between ${modeLabels.event}, which stops at the end of each event and follows the event Ontime loads, and ${modeLabels.script} (M)`}
            onClick={(event) => {
              blurOnPointer(event);
              onCommand({ type: 'mode', mode: 'toggle' });
            }}
            data-testid='teleprompter-playback-mode'
          >
            {modeLabel}
          </button>
        ) : (
          <span className='teleprompter__playback-mode' data-testid='teleprompter-playback-mode'>
            {modeLabel}
          </span>
        )}
      </div>

      {onCommand ? (
        <>
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

          <div className='teleprompter__group'>
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
          </div>

          <div className='teleprompter__group'>
            <ControlButton
              label='Slower (Left arrow)'
              accessibleLabel='Slower'
              onPress={() => onCommand({ type: 'speedBy', value: -speedStep })}
              testId='teleprompter-slower'
            >
              <IoRemove />
            </ControlButton>
            <Speed speed={state.speed} />
            <ControlButton
              label='Faster (Right arrow)'
              accessibleLabel='Faster'
              onPress={() => onCommand({ type: 'speedBy', value: speedStep })}
              testId='teleprompter-faster'
            >
              <IoAdd />
            </ControlButton>
          </div>

          <button
            type='button'
            className='teleprompter__go-loaded'
            disabled={!canGoToLoaded}
            title={canGoToLoaded ? 'Move the reader to the event Ontime has loaded (L)' : undefined}
            onClick={(event) => {
              blurOnPointer(event);
              onCommand({ type: 'goto', target: 'loaded' });
            }}
            data-testid='teleprompter-loaded'
          >
            {getGoToLoadedLabel(loadedEvent, canGoToLoaded)}
          </button>
        </>
      ) : (
        <>
          <span
            className='teleprompter__state'
            aria-label={isPlaying ? 'Playing' : 'Paused'}
            data-testid='teleprompter-state'
          >
            {isPlaying ? <IoPlay /> : <IoPause />}
          </span>
          <Speed speed={state.speed} />
        </>
      )}

      <ControlButton label='Keyboard shortcuts (?)' accessibleLabel='Keyboard shortcuts' onPress={onToggleHelp}>
        <IoHelpCircleOutline />
      </ControlButton>
    </div>
  );
}

function Speed({ speed }: { speed: number }) {
  return (
    <div className='teleprompter__speed' data-testid='teleprompter-speed'>
      {speed}
      <span className='teleprompter__speed-unit'>lpm</span>
    </div>
  );
}

function getGoToLoadedLabel(loadedEvent: LoadedEvent | null, canGoToLoaded: boolean): string {
  if (!loadedEvent) return 'No event loaded';
  if (!loadedEvent.inScript) return 'Loaded event has no script';
  const name = loadedEvent.cue || loadedEvent.title;
  return canGoToLoaded ? `Go to loaded event ${name}` : `Reading loaded event ${name}`;
}
