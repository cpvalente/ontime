import { Playback } from 'ontime-types';

import { usePlaybackControl } from '../../../common/hooks/useSocket';

import PlaybackButtons from './playback-buttons/PlaybackButtons';
import PlaybackTimer from './playback-timer/PlaybackTimer';

import style from './PlaybackControl.module.scss';

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
    </div>
  );
}
