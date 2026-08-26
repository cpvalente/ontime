import type { MouseEvent } from 'react';
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

export default function ControlOverlay({
  isRunning,
  speed,
  canReengageFollow,
  parkedAt,
  controller,
  onToggleHelp,
}: ControlOverlayProps) {
  const isActive = useFadeOutOnInactivity(true);

  // Pointer activation yields focus so the next Space reaches the transport.
  const press = (action: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
    if (event.detail > 0) {
      event.currentTarget.blur();
    }
    action();
  };

  return (
    <div className={cx(['teleprompter__controls', !isActive && 'teleprompter__controls--idle'])}>
      <Tooltip
        text={isRunning ? 'Pause (Space)' : 'Play (Space)'}
        render={
          <IconButton
            variant='subtle-white'
            size='large'
            onClick={press(controller.togglePlay)}
            data-testid='teleprompter-play'
            aria-label={isRunning ? 'Pause' : 'Play'}
          />
        }
      >
        {isRunning ? <IoPause /> : <IoPlay />}
      </Tooltip>

      <Tooltip
        text='Slow down (Left arrow)'
        render={
          <IconButton
            variant='subtle-white'
            size='large'
            onClick={press(() => controller.changeSpeed(-SPEED_STEP))}
            aria-label='Slow down'
          />
        }
      >
        <IoRemove />
      </Tooltip>

      <div className='teleprompter__speed' data-testid='teleprompter-speed'>
        {speed}
        <span className='teleprompter__speed-unit'>lpm</span>
      </div>

      {parkedAt === 'segment' && (
        <span className='teleprompter__parked' data-testid='teleprompter-parked'>
          End of event
        </span>
      )}

      <Tooltip
        text='Speed up (Right arrow)'
        render={
          <IconButton
            variant='subtle-white'
            size='large'
            onClick={press(() => controller.changeSpeed(SPEED_STEP))}
            aria-label='Speed up'
          />
        }
      >
        <IoAdd />
      </Tooltip>

      <Tooltip
        text='Rewind to the top (Home)'
        render={
          <IconButton
            variant={parkedAt === 'script' ? 'primary' : 'subtle-white'}
            size='large'
            onClick={press(() => controller.rewind())}
            aria-label='Rewind to top'
          />
        }
      >
        <IoArrowUp />
      </Tooltip>

      <Tooltip
        text={canReengageFollow ? 'Resume following the loaded event (L)' : 'Following the loaded event'}
        render={
          <IconButton
            variant={canReengageFollow ? 'primary' : 'subtle-white'}
            size='large'
            disabled={!canReengageFollow}
            onClick={press(controller.reengageFollow)}
            data-testid='teleprompter-follow'
            aria-label='Follow the loaded event'
          />
        }
      >
        <IoLocate />
      </Tooltip>

      <Tooltip
        text='Keyboard shortcuts (?)'
        render={
          <IconButton
            variant='subtle-white'
            size='large'
            onClick={press(onToggleHelp)}
            aria-label='Keyboard shortcuts'
          />
        }
      >
        <IoHelpCircleOutline />
      </Tooltip>
    </div>
  );
}
