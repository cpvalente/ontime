import { IconButton } from '@chakra-ui/button';
import style from './PlaybackControl.module.css';
import Countdown from '../../common/components/countdown/Countdown';
import {
  FiPlay,
  FiPause,
  FiSkipBack,
  FiSkipForward,
  FiClock,
} from 'react-icons/fi';
import { format } from 'date-fns';
import { timeFormatSeconds } from '../../common/dateConfig';
import { useEffect, useState } from 'react';
import {
  getStart,
  getPause,
  getRoll,
  getPrevious,
  getNext,
} from '../../app/api/playbackApi';
import { useSocket } from '../../app/context/socketContext';

// BUTTON DEFINITION
const defProps = {
  colorScheme: 'blackAlpha',
  variant: 'outline',
};

const size = {
  width: 90,
};

export default function PlaybackControl() {
  const [playback, setPlayback] = useState(null);
  const socket = useSocket();
  const [timer, setTimer] = useState({
    currentSeconds: null,
    startedAt: null,
    expectedFinish: null,
  });

  // Torbjorn: why is this not updating?
  useEffect(() => {
    if (socket == null) return;

    // Handle timer
    socket.on('timer', (data) => {
      console.log('websocket: got data', data);
      setTimer({ ...data });
    });

    // Clear listener
    return () => socket.off('timer');
  }, [socket]);

  // TO SEND TO SOCKET HERE WE CAN USE
  // socket.emit('test')

  // TODO: Move to playback API
  // Soould this go through sockets?
  const playbackControl = async (action, payload) => {
    switch (action) {
      case 'start': {
        await getStart().then((res) => res.ok && setPlayback('start'));
        break;
      }
      case 'pause': {
        await getPause().then((res) => res.ok && setPlayback('pause'));
        break;
      }
      case 'roll': {
        await getRoll().then((res) => res.ok && setPlayback('roll'));
        break;
      }
      case 'previous': {
        await getPrevious().then((res) => console.log(res));
        break;
      }
      case 'next': {
        await getNext().then((res) => console.log(res));
        break;
      }
      default:
        break;
    }
  };

  const started = timer?.startedAt
    ? format(timer.startedAt, timeFormatSeconds)
    : '...';
  const finish = timer?.expectedFinish
    ? format(timer.expectedFinish, timeFormatSeconds)
    : '...';

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
        <IconButton
          {...size}
          icon={<FiPlay />}
          colorScheme='green'
          onClick={() => playbackControl('start')}
          variant={playback === 'start' ? 'solid' : 'outline'}
        />
        <IconButton
          {...size}
          icon={<FiPause />}
          colorScheme='orange'
          onClick={() => playbackControl('pause')}
          variant={playback === 'pause' ? 'solid' : 'outline'}
        />
        <IconButton
          {...size}
          {...defProps}
          icon={<FiSkipBack />}
          onClick={() => playbackControl('previous')}
        />
        <IconButton
          {...size}
          {...defProps}
          icon={<FiSkipForward />}
          onClick={() => playbackControl('next')}
        />
        <IconButton
          {...size}
          icon={<FiClock />}
          colorScheme='blue'
          onClick={() => playbackControl('roll')}
          variant={playback === 'roll' ? 'solid' : 'outline'}
        />
      </div>
    </div>
  );
}
