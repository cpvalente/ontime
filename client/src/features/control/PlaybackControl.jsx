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
import { useState } from 'react';

// BUTTON DEFINITION
const defProps = {
  colorScheme: 'blackAlpha',
  variant: 'outline',
};

const size = {
  width: 90,
};

export default function PlaybackControl(props) {
  const { timer, roll } = props;
  const { playback } = useState(props.playback);

  const playbackControl = async (action, payload) => {
    switch (action) {
      case 'play': {
        const pb = await fetch('http://localhost:4001/play').then((res) =>
          console.log(res)
        );
        break;
      }
      case 'pause': {
        const pb = await fetch('http://localhost:4001/pause').then((res) =>
          console.log(res)
        );
        break;
      }
      case 'roll': {
        const pb = await fetch('http://localhost:4001/roll').then((res) =>
          console.log(res)
        );
        break;
      }
      case 'previous': {
        const pb = await fetch('http://localhost:4001/previous').then((res) =>
          console.log(res)
        );
        break;
      }
      case 'next': {
        const pb = await fetch('http://localhost:4001/next').then((res) =>
          console.log(res)
        );
        break;
      }
      default:
        break;
    }
  };

  const started = timer.started
    ? format(timer.started, timeFormatSeconds)
    : '...';
  const finish = timer.started
    ? format(timer.finish, timeFormatSeconds)
    : '...';

  return (
    <div className={style.mainContainer}>
      <div className={style.timeContainer}>
        <div className={style.timer}>
          <Countdown time={timer.current} small />
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
          onClick={() => playbackControl('play')}
        />
        <IconButton
          {...size}
          icon={<FiPause />}
          colorScheme='orange'
          onClick={() => playbackControl('pause')}
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
        />
      </div>
    </div>
  );
}
