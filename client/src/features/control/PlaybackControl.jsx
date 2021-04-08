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
import { io } from 'socket.io-client';

// BUTTON DEFINITION
const defProps = {
  colorScheme: 'blackAlpha',
  variant: 'outline',
};

const size = {
  width: 90,
};

export default function PlaybackControl(props) {
  const [playback, setPlayback] = useState(null);
  const [timer, setTimer] = useState({
    currentSeconds: null,
    startedAt: null,
    expectedFinish: null,
  });
  const updateTimer = (vals) => {
    setTimer({ ...timer, ...vals });
  };
  // TODO: Move to config file
  const serverURL = 'http://localhost:4001/';
  const playbackURL = serverURL + 'playback/';

  // WEBSOCKETZ
  useEffect(() => {
    // TODO: add namespace?
    const socket = io(serverURL, { transport: ['websocket'] });
    console.log('websocket started');

    // Handle timer
    socket.on('timer', (data) => {
      updateTimer(data);
    });

    return () => socket.disconnect();
  }, []);

  const playbackControl = async (action, payload) => {
    switch (action) {
      case 'start': {
        await fetch(playbackURL + 'start').then(
          (res) => res.ok && setPlayback('start')
        );
        break;
      }
      case 'pause': {
        await fetch(playbackURL + 'pause').then(
          (res) => res.ok && setPlayback('pause')
        );
        break;
      }
      case 'roll': {
        await fetch(playbackURL + 'roll').then(
          (res) => res.ok && setPlayback('roll')
        );
        break;
      }
      case 'previous': {
        await fetch(playbackURL + 'previous').then((res) => console.log(res));
        break;
      }
      case 'next': {
        await fetch(playbackURL + 'next').then((res) => console.log(res));
        break;
      }
      default:
        break;
    }
  };

  const started = timer.startedAt
    ? format(timer.startedAt, timeFormatSeconds)
    : '...';
  const finish = timer.expectedFinish
    ? format(timer.expectedFinish, timeFormatSeconds)
    : '...';

  return (
    <div className={style.mainContainer}>
      <div className={style.timeContainer}>
        <div className={style.timer}>
          <Countdown time={timer.currentSeconds} small />
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
