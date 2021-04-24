import style from './PlaybackControl.module.css';
import Countdown from '../../common/components/countdown/Countdown';
import { stringFromMillis } from '../../common/dateConfig';
import { useEffect, useState } from 'react';
import { useSocket } from '../../app/context/socketContext';
import StartIconBtn from '../../common/components/buttons/StartIconBtn';
import PauseIconBtn from '../../common/components/buttons/PauseIconBtn';
import PrevIconBtn from '../../common/components/buttons/PrevIconBtn';
import NextIconBtn from '../../common/components/buttons/NextIconBtn';
import RollIconBtn from '../../common/components/buttons/RollIconBtn';
import UnloadIconBtn from '../../common/components/buttons/UnloadIconBtn';
import ReloadIconButton from '../../common/components/buttons/ReloadIconBtn';

export default function PlaybackControl() {
  const socket = useSocket();
  const [playback, setPlayback] = useState(null);
  const [timer, setTimer] = useState({
    clock: null,
    currentSeconds: null,
    startedAt: null,
    expectedFinish: null,
  });
  const [selectedId, setSelectedId] = useState(null);

  const resetTimer = () => {
    setTimer({
      currentSeconds: null,
      startedAt: null,
      expectedFinish: null,
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
      setTimer({ ...data });
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

  const started = stringFromMillis(timer.startedAt, true);
  const finish = stringFromMillis(timer.expectedFinish, true);

  return (
    <div className={style.mainContainer}>
      <div className={style.timeContainer}>
        <div className={style.timer}>
          <Countdown time={timer?.currentSeconds} small />
        </div>
        <div className={style.start}>
          <span className={style.tag}>Started at </span>
          <span className={style.time}>{started}</span>
        </div>
        <div className={style.finish}>
          <span className={style.tag}>Finish at </span>
          <span className={style.time}>{finish}</span>
        </div>
      </div>

      <div className={style.playbackContainer}>
        <StartIconBtn
          active={playback === 'start'}
          clickhandler={() => playbackControl('start')}
          disabled={!selectedId}
        />
        <PauseIconBtn
          active={playback === 'pause'}
          clickhandler={() => playbackControl('pause')}
          disabled={!selectedId}
        />
        <RollIconBtn
          active={playback === 'roll'}
          clickhandler={() => playbackControl('roll')}
        />
      </div>
      <div className={style.playbackContainer}>
        <PrevIconBtn clickhandler={() => playbackControl('previous')} />
        <NextIconBtn clickhandler={() => playbackControl('next')} />
        <UnloadIconBtn
          clickhandler={() => playbackControl('unload')}
          disabled={!selectedId}
        />
        <ReloadIconButton
          clickhandler={() => playbackControl('reload')}
          disabled={!selectedId}
        />
      </div>
    </div>
  );
}
