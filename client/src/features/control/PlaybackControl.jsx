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

// BUTTON DEFINITION
const defProps = {
  colorScheme: 'blackAlpha',
  variant: 'outline',
};

const size = {
  width: 90,
};
export default function PlaybackControl(props) {
  const { time, roll } = props;

  return (
    <div className={style.mainContainer}>
      <div className={style.timeContainer}>
        <div className={style.timer}>
          <Countdown time={time} small />
        </div>
        <div className={style.start}>
          <span className={style.tag}>Started at </span>
          <span className={style.time}>12:01</span>
        </div>
        <div className={style.finish}>
          <span className={style.tag}>Finish at </span>
          <span className={style.time}>13:01</span>
        </div>
      </div>

      <div className={style.playbackContainer}>
        <IconButton
          {...size}
          icon={<FiPlay />}
          colorScheme='green'
          onClick={() => props.playbackControl('play')}
        />
        <IconButton
          {...size}
          icon={<FiPause />}
          colorScheme='orange'
          onClick={() => props.playbackControl('pause')}
        />
        <IconButton
          {...size}
          {...defProps}
          icon={<FiSkipBack />}
          onClick={() => props.playbackControl('previous')}
        />
        <IconButton
          {...size}
          {...defProps}
          icon={<FiSkipForward />}
          onClick={() => props.playbackControl('next')}
        />
        <IconButton
          {...size}
          icon={<FiClock />}
          colorScheme='blue'
          onClick={() => props.playbackControl('roll')}
        />
      </div>
    </div>
  );
}
