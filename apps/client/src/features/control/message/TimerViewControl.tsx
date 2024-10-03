import { Button } from '@chakra-ui/react';

import { setMessage, useTimerViewControl } from '../../../common/hooks/useSocket';

import TimerPreview from './TimerPreview';

import style from './MessageControl.module.scss';

import { useTranslation } from '../../../translation/TranslationProvider';

export default function TimerControlsPreview() {
  const { blackout, blink, secondarySource } = useTimerViewControl();

  const toggleSecondary = (newValue: 'aux' | 'external' | null) => {
    if (secondarySource === newValue) {
      setMessage.timerSecondary(null);
    } else {
      setMessage.timerSecondary(newValue);
    }
  };

  const { getLocalizedString } = useTranslation();

  return (
    <div className={style.previewContainer}>
      <TimerPreview />

      <div className={style.options}>
        <Button
          size='sm'
          variant={secondarySource === 'aux' ? 'ontime-filled' : 'ontime-subtle'}
          onClick={() => toggleSecondary('aux')}
        >
          {getLocalizedString('timer.show_auxtime')}
        </Button>
        <Button
          size='sm'
          variant={secondarySource === 'external' ? 'ontime-filled' : 'ontime-subtle'}
          onClick={() => toggleSecondary('external')}
        >
          {getLocalizedString('timer.show_external')}
        </Button>

        <hr className={style.divider} />

        <Button
          size='sm'
          variant={blink ? 'ontime-filled' : 'ontime-subtle'}
          onClick={() => setMessage.timerBlink(!blink)}
          data-testid='toggle timer blink'
        >
          {getLocalizedString('timer.blink')}
        </Button>
        <Button
          size='sm'
          className={style.blackoutButton}
          variant={blackout ? 'ontime-filled' : 'ontime-subtle'}
          onClick={() => setMessage.timerBlackout(!blackout)}
          data-testid='toggle timer blackout'
        >
          {getLocalizedString('timer.blackout')}
        </Button>
      </div>
    </div>
  );
}
