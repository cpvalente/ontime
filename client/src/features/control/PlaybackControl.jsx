import style from './PlaybackControl.module.css';
import Countdown from '../../common/components/countdown/Countdown';
import { stringFromMillis } from '../../common/dateConfig';
import { useEffect, useState } from 'react';
import {
  getStart,
  getPause,
  getRoll,
  getPrevious,
  getNext,
} from '../../app/api/playbackApi';
import { useSocket } from '../../app/context/socketContext';
import StartIconBtn from '../../common/components/buttons/StartIconBtn';
import PauseIconBtn from '../../common/components/buttons/PauseIconBtn';
import PrevIconBtn from '../../common/components/buttons/PrevIconBtn';
import NextIconBtn from '../../common/components/buttons/NextIconBtn';
import RollIconBtn from '../../common/components/buttons/RollIconBtn';

export default function PlaybackControl() {
  const socket = useSocket();
  const [playback, setPlayback] = useState(null);
  const [timer, setTimer] = useState({
    currentSeconds: null,
    startedAt: null,
    expectedFinish: null,
  });

  const updateState = () => {
    if (socket == null) return;

    // ask for playstate
    socket.emit('get-state');
  };

  // handle incoming messages
  useEffect(() => {
    if (socket == null) return;

    updateState();

    // Handle playstate
    socket.on('playstate', (data) => {
      setPlayback(data);
    });

    // Handle timer
    socket.on('timer', (data) => {
      setTimer({ ...data });
    });

    // Clear listener
    return () => {
      socket.off('playstate');
      socket.off('timer');
    };
  }, [socket]);

  // TODO: Move to playback API
  // Soould this go through sockets?
  const playbackControl = async (action, payload) => {
    switch (action) {
      case 'start': {
        await getStart().then(
          (res) => res.statusText === 'OK' && setPlayback('start')
        );
        break;
      }
      case 'pause': {
        await getPause().then(
          (res) => res.statusText === 'OK' && setPlayback('pause')
        );
        break;
      }
      case 'roll': {
        await getRoll().then((res) => res.ok && setPlayback('roll'));
        break;
      }
      case 'previous': {
        await getPrevious().then(updateState);
        break;
      }
      case 'next': {
        await getNext().then(updateState);
        break;
      }
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
          clickHandler={() => playbackControl('start')}
        />
        <PauseIconBtn
          active={playback === 'pause'}
          clickHandler={() => playbackControl('pause')}
        />
        <PrevIconBtn clickHandler={() => playbackControl('previous')} />
        <NextIconBtn clickHandler={() => playbackControl('next')} />
        <RollIconBtn
          active={playback === 'roll'}
          clickHandler={() => playbackControl('roll')}
        />
      </div>
    </div>
  );
}
