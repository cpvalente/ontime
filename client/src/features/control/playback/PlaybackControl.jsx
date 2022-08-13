import React, { useCallback } from 'react';
import { useSocket } from 'common/context/socketContext';

import { usePlaybackControlProvider } from '../../../common/hooks/useSocketProvider';

import PlaybackButtons from './PlaybackButtons';
import PlaybackTimer from './PlaybackTimer';

import style from './PlaybackControl.module.scss';

export default function PlaybackControl() {
  const socket = useSocket();
  const { data, resetData } = usePlaybackControlProvider();

  const playbackControl = useCallback(
    (action) => {
      switch (action) {
        case 'start':
          socket.emit('set-playstate', 'start');
          break;
        case 'pause':
          socket.emit('set-playstate', 'pause');
          break;
        case 'roll':
          socket.emit('set-playstate', 'roll');
          break;
        case 'previous':
          socket.emit('set-playstate', 'previous');
          resetData();
          break;
        case 'next':
          socket.emit('set-playstate', 'next');
          resetData();
          break;
        case 'unload':
          socket.emit('set-playstate', 'unload');
          resetData();
          break;
        case 'reload':
          socket.emit('set-playstate', 'reload');
          resetData();
          break;
        default:
          break;
      }
    },
    [resetData, socket]
  );

  return (
    <div className={style.mainContainer}>
      <PlaybackTimer
        timer={data.timer}
        playback={data.playback}
        selectedId={data.selectedEventId}
        handleIncrement={(amount) => socket.emit('increment-timer', amount)}
      />
      <PlaybackButtons
        playback={data.playback}
        selectedId={data.selectedEventId}
        noEvents={data.numEvents < 1}
        playbackControl={playbackControl}
      />
    </div>
  );
}
