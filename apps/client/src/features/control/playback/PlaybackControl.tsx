import { Playback } from 'ontime-types';

import { usePlaybackControl } from '../../../common/hooks/useSocket';

import PlaybackButtons from './PlaybackButtons';
import PlaybackTimer from './PlaybackTimer';

import style from './PlaybackControl.module.scss';

export default function PlaybackControl() {
  const { data } = usePlaybackControl();

  return (
    <div className={style.mainContainer}>
      <PlaybackTimer playback={data.playback as Playback} />
      <PlaybackButtons playback={data.playback} noEvents={data.numEvents < 1} />
    </div>
  );
}
