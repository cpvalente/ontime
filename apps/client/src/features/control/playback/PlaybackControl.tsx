import { Playback } from 'ontime-types';

import { setExtraTimer, useExtraTimerPlayback, useExtraTimerTime, usePlaybackControl } from '../../../common/hooks/useSocket';

import PlaybackButtons from './playback-buttons/PlaybackButtons';
import PlaybackTimer from './playback-timer/PlaybackTimer';

import style from './PlaybackControl.module.scss';
import TapButton from './tap-button/TapButton';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoPause } from '@react-icons/all-files/io5/IoPause';
import { IoStop } from '@react-icons/all-files/io5/IoStop';
import TimeInput from '../../../common/components/input/time-input/TimeInput';

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
  )
}

function ExtraTimerControl() {
  const playback = useExtraTimerPlayback();

  const { start, pause, stop } = setExtraTimer;

  return (
    <div style={{display: 'flex', gap: '0.5rem', marginTop: '2rem'}}>
      <ExtraTimer />
      <TapButton onClick={start} theme={Playback.Play} active={playback === 'play'}>
        <IoPlay />
      </TapButton>
      <TapButton onClick={pause} theme={Playback.Pause} active={playback === 'pause'}>
        <IoPause />
      </TapButton>      
      <TapButton onClick={stop} theme={Playback.Stop}>
        <IoStop />
      </TapButton>
    </div>
  )
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
