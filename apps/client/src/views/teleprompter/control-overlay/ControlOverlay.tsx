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

import IconButton from '../../../common/components/buttons/IconButton';
import Tooltip from '../../../common/components/tooltip/Tooltip';
import { useFadeOutOnInactivity } from '../../../common/hooks/useFadeOutOnInactivity';
import { cx } from '../../../common/utils/styleUtils';
import { speedStep, type TeleprompterPayload } from '../teleprompter.keymap';
import { roleLabels, type TeleprompterRole } from '../teleprompter.options';

/** The event Ontime has loaded, as the teleprompter script names it */
export type LoadedEvent = { id: string; cue: string; title: string; inScript: boolean };

interface ControlOverlayProps {
  role: TeleprompterRole;
  transport: TeleprompterState;
  cued: boolean;
  loadedEvent: LoadedEvent | null;
  /** where the buttons send commands, or nothing for a screen which only displays */
  onCommand?: (payload: TeleprompterPayload) => void;
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
export default function ControlOverlay({
  role,
  transport,
  cued,
  loadedEvent,
  onCommand,
  onToggleHelp,
}: ControlOverlayProps) {
  const isActive = useFadeOutOnInactivity(true);
  const [isHovered, setIsHovered] = useState(false);
  const isVisible = isActive || isHovered;

  // the button would move the reader only when they are away from the loaded event
  const canGoToLoaded = loadedEvent !== null && loadedEvent.inScript && transport.eventId !== loadedEvent.id;

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
        <span className='teleprompter__playback-mode' data-testid='teleprompter-playback-mode'>
          {cued ? 'Stops at each event' : 'Plays through'}
        </span>
      </div>

      {onCommand ? (
        <>
          <button
            type='button'
            className={cx(['teleprompter__play', transport.playing && 'teleprompter__play--playing'])}
            aria-pressed={transport.playing}
            aria-label={transport.playing ? 'Pause' : 'Play'}
            title={transport.playing ? 'Pause (Space)' : 'Play (Space)'}
            onClick={(event) => {
              blurOnPointer(event);
              onCommand('toggle');
            }}
            data-testid='teleprompter-play'
          >
            {transport.playing ? <IoPause /> : <IoPlay />}
          </button>

          <div className='teleprompter__group'>
            <ControlButton
              label='Previous event (Shift + Up arrow)'
              accessibleLabel='Previous event'
              onPress={() => onCommand('previous')}
              testId='teleprompter-previous'
            >
              <IoPlaySkipBack />
            </ControlButton>
            <ControlButton
              label='Next event (Shift + Down arrow)'
              accessibleLabel='Next event'
              onPress={() => onCommand('next')}
              testId='teleprompter-next'
            >
              <IoPlaySkipForward />
            </ControlButton>
          </div>

          <div className='teleprompter__group'>
            <ControlButton
              label='Slower (Left arrow)'
              accessibleLabel='Slower'
              onPress={() => onCommand({ speed: { by: -speedStep } })}
              testId='teleprompter-slower'
            >
              <IoRemove />
            </ControlButton>
            <Speed speed={transport.speed} />
            <ControlButton
              label='Faster (Right arrow)'
              accessibleLabel='Faster'
              onPress={() => onCommand({ speed: { by: speedStep } })}
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
              onCommand('loaded');
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
            aria-label={transport.playing ? 'Playing' : 'Paused'}
            data-testid='teleprompter-state'
          >
            {transport.playing ? <IoPlay /> : <IoPause />}
          </span>
          <Speed speed={transport.speed} />
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
