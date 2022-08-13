import React from 'react';

import { usePlaybackControlProvider } from '../../../common/hooks/useSocketProvider';

import PlaybackButtons from './PlaybackButtons';
import PlaybackTimer from './PlaybackTimer';

import style from './PlaybackControl.module.scss';

export default function PlaybackControl() {
  const { data, setPlayback } = usePlaybackControlProvider();

  return (
    <div className={style.mainContainer}>
      <PlaybackTimer
        timer={data.timer}
        playback={data.playback}
        selectedId={data.selectedEventId}
        handleIncrement={(amount) => setPlayback.delay(amount)}
      />
      <PlaybackButtons
        playback={data.playback}
        selectedId={data.selectedEventId}
        noEvents={data.numEvents < 1}
        playbackControl={setPlayback}
      />
    </div>
  );
}
