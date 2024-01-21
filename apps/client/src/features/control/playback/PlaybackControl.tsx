import { IoArrowDown } from '@react-icons/all-files/io5/IoArrowDown';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';
import { IoPause } from '@react-icons/all-files/io5/IoPause';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoStop } from '@react-icons/all-files/io5/IoStop';
import { Playback } from 'ontime-types';

import TimeInput from '../../../common/components/input/time-input/TimeInput';
import { setExtraTimer, useExtraTimer, useExtraTimerTime, usePlaybackControl } from '../../../common/hooks/useSocket';

import PlaybackButtons from './playback-buttons/PlaybackButtons';
import PlaybackTimer from './playback-timer/PlaybackTimer';
import TapButton from './tap-button/TapButton';

import style from './PlaybackControl.module.scss';

function ExtraTimer() {
  const time = useExtraTimerTime();
  const { setTime } = setExtraTimer;

  return (
    <TimeInput
      submitHandler={(_field, value) => setTime(value)}
      name='extraTimer'
      time={time}
      placeholder='Extra Timer'
    />
  );
}

function ExtraTimerControl() {
  const { playback, direction } = useExtraTimer();

  const { start, pause, stop, setDirection } = setExtraTimer;

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem' }}>
      <ExtraTimer />
      <TapButton className={style.smallButton} onClick={start} theme={Playback.Play} active={playback === 'play'}>
        <IoPlay />
      </TapButton>
      <TapButton className={style.smallButton} onClick={pause} theme={Playback.Pause} active={playback === 'pause'}>
        <IoPause />
      </TapButton>
      <TapButton className={style.smallButton} onClick={stop} theme={Playback.Stop}>
        <IoStop />
      </TapButton>
      <TapButton
        className={style.smallButton}
        onClick={() => {
          setDirection(direction === 'count-down' ? 'count-up' : 'count-down');
        }}
        theme={Playback.Roll}
      >
        {direction === 'count-down' && <IoArrowDown />}
        {direction === 'count-up' && <IoArrowUp />}
      </TapButton>
    </div>
  );
}

export default function PlaybackControl() {
  const data = usePlaybackControl();

  return (
    <div className={style.mainContainer}>
      <PlaybackTimer playback={data.playback as Playback} />
      <PlaybackButtons
        playback={data.playback}
        numEvents={data.numEvents}
        selectedEventIndex={data.selectedEventIndex}
      />
      <ExtraTimerControl />
    </div>
  );
}
