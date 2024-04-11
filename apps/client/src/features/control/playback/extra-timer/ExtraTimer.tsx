import { IoArrowDown } from '@react-icons/all-files/io5/IoArrowDown';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';
import { IoPause } from '@react-icons/all-files/io5/IoPause';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoStop } from '@react-icons/all-files/io5/IoStop';
import { Playback, SimpleDirection, SimplePlayback } from 'ontime-types';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import { setExtraTimer, useExtraTimerControl, useExtraTimerTime } from '../../../../common/hooks/useSocket';
import { forgivingStringToMillis } from '../../../../common/utils/dateConfig';
import TapButton from '../tap-button/TapButton';

import style from './ExtraTimer.module.scss';

export function ExtraTimer() {
  const { playback, direction } = useExtraTimerControl();

  const { start, pause, stop, setDirection } = setExtraTimer;

  const toggleDirection = () => {
    const newDirection = direction === SimpleDirection.CountDown ? SimpleDirection.CountUp : SimpleDirection.CountDown;
    setDirection(newDirection);
  };

  const userCan = {
    start: playback !== SimplePlayback.Start,
    pause: playback === SimplePlayback.Start,
    stop: playback !== SimplePlayback.Stop,
  };

  return (
    <div className={style.extraRow}>
      <ExtraTimeInput />
      <TapButton onClick={toggleDirection} aspect='tight'>
        {direction === SimpleDirection.CountDown && <IoArrowDown data-testid='aux-timer-direction' />}
        {direction === SimpleDirection.CountUp && <IoArrowUp data-testid='aux-timer-direction' />}
      </TapButton>

      <TapButton
        onClick={start}
        theme={Playback.Play}
        active={playback === SimplePlayback.Start}
        disabled={!userCan.start}
      >
        <IoPlay data-testid='aux-timer-start' />
      </TapButton>
      <TapButton
        onClick={pause}
        theme={Playback.Pause}
        active={playback === SimplePlayback.Pause}
        disabled={!userCan.pause}
      >
        <IoPause data-testid='aux-timer-pause' />
      </TapButton>
      <TapButton onClick={stop} theme={Playback.Stop} disabled={!userCan.stop}>
        <IoStop data-testid='aux-timer-stop' />
      </TapButton>
    </div>
  );
}

function ExtraTimeInput() {
  const time = useExtraTimerTime();
  const { setDuration } = setExtraTimer;

  const handleTimeUpdate = (_field: string, value: string) => {
    const newTime = forgivingStringToMillis(value);
    setDuration(newTime / 1000); //frontend api is seconds based;
  };

  return (
    <TimeInput<'auxTimer'> submitHandler={handleTimeUpdate} name='auxTimer' time={time} placeholder='Aux Timer 1' />
  );
}
