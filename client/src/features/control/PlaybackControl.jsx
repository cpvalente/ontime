import style from './PlaybackControl.module.css';
import { useEffect, useState } from 'react';
import { useSocket } from 'app/context/socketContext';
import PlaybackButtons from './PlaybackButtons';
import PlaybackTimer from './PlaybackTimer';

export default function PlaybackControl() {
  const socket = useSocket();
  const [playback, setPlayback] = useState(null);
  const [timer, setTimer] = useState({
    clock: null,
    running: null,
    startedAt: null,
    expectedFinish: null,
    secondary: null,
  });
  const [selectedId, setSelectedId] = useState(null);

  const resetTimer = () => {
    setTimer({
      running: null,
      startedAt: null,
      expectedFinish: null,
      secondary: null,
    });
  };

  // handle incoming messages
  useEffect(() => {
    if (socket == null) return;

    socket.emit('get-timer');
    socket.emit('get-playstate');
    socket.emit('get-selected-id');

    // Handle playstate
    socket.on('playstate', (data) => {
      setPlayback(data);
    });

    // Handle timer
    socket.on('timer', (data) => {
      setTimer(data);
    });

    // Handle selected event
    socket.on('selected-id', (data) => {
      setSelectedId(data);
    });

    // Clear listener
    return () => {
      socket.off('playstate');
      socket.off('timer');
      socket.off('selected-id');
    };
  }, [socket]);

  const playbackControl = async (action, payload) => {
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
        resetTimer();
        break;
      case 'next':
        socket.emit('set-playstate', 'next');
        resetTimer();
        break;
      case 'unload':
        socket.emit('set-playstate', 'unload');
        resetTimer();
        break;
      case 'reload':
        socket.emit('set-playstate', 'reload');
        resetTimer();
        break;
      default:
        break;
    }
  };

  return (
    <div className={style.mainContainer}>
      <PlaybackTimer
        timer={timer}
        playback={playback}
        handleIncrement={(amount) => socket.emit('increment-timer', amount)}
      />
      <PlaybackButtons
        playback={playback}
        selectedId={selectedId}
        playbackControl={playbackControl}
      />
    </div>
  );
}
