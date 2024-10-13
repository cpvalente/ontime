import { Playback } from 'ontime-types';

import { usePlaybackControl } from '../../../common/hooks/useSocket';

import AddTime from './add-time/AddTime';
import { AuxTimer } from './aux-timer/AuxTimer';
import PlaybackButtons from './playback-buttons/PlaybackButtons';
import PlaybackTimer from './playback-timer/PlaybackTimer';
import TimerSpeed from './timer-speed/TimerSpeed';

import style from './PlaybackControl.module.scss';

export default function PlaybackControl() {
  const data = usePlaybackControl();

  return (
    <div className={style.mainContainer}>
      <PlaybackTimer playback={data.playback as Playback}>
        <AddTime playback={data.playback} />
      </PlaybackTimer>
      <PlaybackButtons
        playback={data.playback}
        numEvents={data.numEvents}
        selectedEventIndex={data.selectedEventIndex}
        timerPhase={data.timerPhase}
      />
      <TimerSpeed />
      <AuxTimer />
    </div>
  );
}
