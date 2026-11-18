import { LuMonitorOff, LuZap } from 'react-icons/lu';

import Button from '../../../common/components/buttons/Button';
import { setMessage, useTimerViewControl } from '../../../common/hooks/useSocket';
import TimerPreview from './TimerPreview';

import style from './TimerViewControl.module.scss';

export default function TimerControlsPreview() {
  const { blackout, blink } = useTimerViewControl();

  return (
    <div className={style.previewContainer}>
      <TimerPreview />
      <div className={style.toggles}>
        <Button
          variant={blink ? 'primary' : 'subtle'}
          fluid
          onClick={() => setMessage.timerBlink(!blink)}
          data-testid='toggle timer blink'
        >
          <LuZap /> Blink
        </Button>
        <Button
          variant={blackout ? 'primary' : 'subtle'}
          fluid
          onClick={() => setMessage.timerBlackout(!blackout)}
          data-testid='toggle timer blackout'
        >
          <LuMonitorOff /> Blackout
        </Button>
      </div>
    </div>
  );
}
