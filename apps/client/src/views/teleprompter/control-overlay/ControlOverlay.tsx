import type { TeleprompterState } from 'ontime-types';
import type { MouseEvent, PropsWithChildren } from 'react';
import { IoHelpCircleOutline } from 'react-icons/io5';

import IconButton from '../../../common/components/buttons/IconButton';
import Tooltip from '../../../common/components/tooltip/Tooltip';
import { useFadeOutOnInactivity } from '../../../common/hooks/useFadeOutOnInactivity';
import { cx } from '../../../common/utils/styleUtils';

interface ControlOverlayProps {
  transport: TeleprompterState;
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

export function ControlButton({
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

function getStatus(transport: TeleprompterState): string {
  if (transport.stoppedAt === 'event') return 'End of event';
  if (transport.stoppedAt === 'script') return 'End of script';
  return transport.playing ? 'Playing' : 'Paused';
}

export default function ControlOverlay({ transport, onToggleHelp, children }: PropsWithChildren<ControlOverlayProps>) {
  const isActive = useFadeOutOnInactivity(true);

  return (
    <div className={cx(['teleprompter__controls', !isActive && 'teleprompter__controls--idle'])}>
      {children}
      <div className='teleprompter__speed' data-testid='teleprompter-speed'>
        {transport.speed}
        <span className='teleprompter__speed-unit'>lpm</span>
      </div>
      <span className='teleprompter__status' data-testid='teleprompter-status'>
        {getStatus(transport)}
      </span>
      <ControlButton label='Keyboard shortcuts (?)' accessibleLabel='Keyboard shortcuts' onPress={onToggleHelp}>
        <IoHelpCircleOutline />
      </ControlButton>
    </div>
  );
}
