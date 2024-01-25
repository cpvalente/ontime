import { IoArrowDown } from '@react-icons/all-files/io5/IoArrowDown';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';
import { IoPause } from '@react-icons/all-files/io5/IoPause';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoStop } from '@react-icons/all-files/io5/IoStop';
import { Playback, SimpleDirection, SimplePlayback } from 'ontime-types';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import { setExtraTimer, useExtraTimerControl, useExtraTimerTime } from '../../../../common/hooks/useSocket';
import TapButton from '../tap-button/TapButton';

import style from './ExtraTimer.module.scss';

export function ExtraTimer() {
  const { playback, direction } = useExtraTimerControl();

  const { start, pause, stop, setDirection } = setExtraTimer;

  return (
    <div className={style.extraRow}>
      <ExtraTimeInput />
      <TapButton onClick={start} theme={Playback.Play} active={playback === SimplePlayback.Start}>
        <IoPlay />
      </TapButton>
      <TapButton onClick={pause} theme={Playback.Pause} active={playback === SimplePlayback.Pause}>
        <IoPause />
      </TapButton>
      <TapButton onClick={stop} theme={Playback.Stop}>
        <IoStop />
      </TapButton>
      <TapButton
        onClick={() => {
          setDirection(direction === SimpleDirection.CountDown ? SimpleDirection.CountUp : SimpleDirection.CountDown);
        }}
      >
        {direction === SimpleDirection.CountDown && <IoArrowDown />}
        {direction === SimpleDirection.CountUp && <IoArrowUp />}
      </TapButton>
    </div>
  );
}

function ExtraTimeInput() {
  const time = useExtraTimerTime();
  const { setTime } = setExtraTimer;

  return (
    <TimeInput<'extraTimer'>
      submitHandler={(_field, value) => setTime(value)}
      name='extraTimer'
      time={time}
      placeholder='Extra Timer'
    />
  );
}
