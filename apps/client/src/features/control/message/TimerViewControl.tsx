import { Button } from '@chakra-ui/react';

import { setMessage, useTimerViewControl } from '../../../common/hooks/useSocket';

import TimerPreview from './TimerPreview';

import style from './MessageControl.module.scss';

export default function TimerControlsPreview() {
  const { blackout, blink, secondarySource } = useTimerViewControl();

  const toggleSecondary = (newValue: 'aux' | 'external' | null) => {
    if (secondarySource === newValue) {
      setMessage.timerSecondary(null);
    } else {
      setMessage.timerSecondary(newValue);
    }
  };

  return (
    <div className={style.previewContainer}>
      <TimerPreview />

      <div className={style.options}>
        <Button
          size='sm'
          variant={secondarySource === 'aux' ? 'ontime-filled' : 'ontime-subtle'}
          onClick={() => toggleSecondary('aux')}
        >
          Show Aux timer
        </Button>
        <Button
          size='sm'
          variant={secondarySource === 'external' ? 'ontime-filled' : 'ontime-subtle'}
          onClick={() => toggleSecondary('external')}
        >
          Show external
        </Button>

        <hr className={style.divider} />

        <Button
          size='sm'
          variant={blink ? 'ontime-filled' : 'ontime-subtle'}
          onClick={() => setMessage.timerBlink(!blink)}
          data-testid='toggle timer blink'
        >
          Blink
        </Button>
        <Button
          size='sm'
          className={style.blackoutButton}
          variant={blackout ? 'ontime-filled' : 'ontime-subtle'}
          onClick={() => setMessage.timerBlackout(!blackout)}
          data-testid='toggle timer blackout'
        >
          Blackout screen
        </Button>
      </div>
    </div>
  );
}
