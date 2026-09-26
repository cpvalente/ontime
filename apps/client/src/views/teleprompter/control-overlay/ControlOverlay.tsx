import type { MouseEvent, PropsWithChildren } from 'react';
import { IoAdd, IoArrowUp, IoHelpCircleOutline, IoLocate, IoPause, IoPlay, IoRemove } from 'react-icons/io5';

import IconButton from '../../../common/components/buttons/IconButton';
import Tooltip from '../../../common/components/tooltip/Tooltip';
import { useFadeOutOnInactivity } from '../../../common/hooks/useFadeOutOnInactivity';
import { cx } from '../../../common/utils/styleUtils';
import { SPEED_STEP } from '../teleprompter.scroll';
import type { ParkedAt, TeleprompterController } from '../teleprompter.types';

interface ControlOverlayProps {
  isRunning: boolean;
  speed: number;
  canReengageFollow: boolean;
  parkedAt: ParkedAt;
  controller: TeleprompterController;
  onToggleHelp: () => void;
}

interface ControlButtonProps {
  label: string;
  accessibleLabel: string;
  onPress: () => void;
  disabled?: boolean;
  isActive?: boolean;
  testId?: string;
}

function ControlButton({
  label,
  accessibleLabel,
  onPress,
  disabled,
  isActive,
  testId,
  children,
}: PropsWithChildren<ControlButtonProps>) {
  // Pointer activation yields focus so the next Space reaches the transport.
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (event.detail > 0) {
      event.currentTarget.blur();
    }
    onPress();
  };

  return (
    <Tooltip
      text={label}
      render={
        <IconButton
          variant={isActive ? 'primary' : 'subtle-white'}
          size='large'
          onClick={handleClick}
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

export default function ControlOverlay({
  isRunning,
  speed,
  canReengageFollow,
  parkedAt,
  controller,
  onToggleHelp,
}: ControlOverlayProps) {
  const isActive = useFadeOutOnInactivity(true);

  return (
    <div className={cx(['teleprompter__controls', !isActive && 'teleprompter__controls--idle'])}>
      <ControlButton
        label={isRunning ? 'Pause (Space)' : 'Play (Space)'}
        accessibleLabel={isRunning ? 'Pause' : 'Play'}
        onPress={controller.togglePlay}
        testId='teleprompter-play'
      >
        {isRunning ? <IoPause /> : <IoPlay />}
      </ControlButton>

      <ControlButton
        label='Slow down (Left arrow)'
        accessibleLabel='Slow down'
        onPress={() => controller.changeSpeed(-SPEED_STEP)}
      >
        <IoRemove />
      </ControlButton>

      <div className='teleprompter__speed' data-testid='teleprompter-speed'>
        {speed}
        <span className='teleprompter__speed-unit'>lpm</span>
      </div>

      {parkedAt === 'segment' && (
        <span className='teleprompter__parked' data-testid='teleprompter-parked'>
          End of event
        </span>
      )}

      <ControlButton
        label='Speed up (Right arrow)'
        accessibleLabel='Speed up'
        onPress={() => controller.changeSpeed(SPEED_STEP)}
      >
        <IoAdd />
      </ControlButton>

      <ControlButton
        label='Rewind to the top (Home)'
        accessibleLabel='Rewind to top'
        onPress={controller.rewind}
        isActive={parkedAt === 'script'}
      >
        <IoArrowUp />
      </ControlButton>

      <ControlButton
        label={canReengageFollow ? 'Resume following the loaded event (L)' : 'Following the loaded event'}
        accessibleLabel='Follow the loaded event'
        onPress={controller.reengageFollow}
        disabled={!canReengageFollow}
        isActive={canReengageFollow}
        testId='teleprompter-follow'
      >
        <IoLocate />
      </ControlButton>

      <ControlButton label='Keyboard shortcuts (?)' accessibleLabel='Keyboard shortcuts' onPress={onToggleHelp}>
        <IoHelpCircleOutline />
      </ControlButton>
    </div>
  );
}
