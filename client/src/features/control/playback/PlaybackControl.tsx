import { usePlaybackControlProvider } from '../../../common/hooks/useSocketProvider';
import { Playstate } from '../../../common/models/OntimeTypes';

import PlaybackButtons from './PlaybackButtons';
import PlaybackTimer from './PlaybackTimer';

import style from './PlaybackControl.module.scss';

export default function PlaybackControl() {
  const { data } = usePlaybackControlProvider();

  return (
    <div className={style.mainContainer}>
      <PlaybackTimer
        playback={data.playback as Playstate}
        selectedId={data.selectedEventId}
      />
      <PlaybackButtons
        playback={data.playback}
        selectedId={data.selectedEventId}
        noEvents={data.numEvents < 1}
      />
    </div>
  );
}
