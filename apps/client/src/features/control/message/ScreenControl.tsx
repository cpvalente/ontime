import Button from '../../../common/components/buttons/Button';
import { setMessage, useScreenControl } from '../../../common/hooks/useSocket';

import style from './ScreenControl.module.scss';

export default function ScreenControl() {
  const { blackout, blink } = useScreenControl();

  return (
    <div className={style.screenControl}>
      <Button
        variant={blink ? 'primary' : 'subtle'}
        aria-pressed={blink}
        fluid
        onClick={() => setMessage.timerBlink(!blink)}
        data-testid='toggle timer blink'
      >
        Blink
      </Button>
      <Button
        variant={blackout ? 'destructive' : 'subtle'}
        aria-pressed={blackout}
        fluid
        onClick={() => setMessage.timerBlackout(!blackout)}
        data-testid='toggle timer blackout'
      >
        Blackout
      </Button>
    </div>
  );
}
