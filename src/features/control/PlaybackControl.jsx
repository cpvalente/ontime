import { Button } from '@chakra-ui/button';
import style from './PlaybackControl.module.css';
import Countdown from '../../common/components/countdown/Countdown';
import { ArrowBackIcon, ArrowForwardIcon } from '@chakra-ui/icons';

// BUTTON DEFINITION
const defProps = {
  colorScheme: 'blackAlpha',
  variant: 'outline',
};

const bigSize = 120;

export default function PlaybackControl(props) {
  const { time, roll } = props;

  return (
    <div className={style.mainContainer}>
      <div className={style.timeContainer}>
        <div className={style.timer}>
          <Countdown time={time} small />
        </div>
      </div>
      <div className={style.playbackContainer}>
        <Button
          width={bigSize}
          colorScheme='green'
          className={style.start}
          disabled={roll}
          onClick={() => props.playbackControl('start')}
        >
          Start
        </Button>
        <Button
          width={bigSize}
          colorScheme='orange'
          className={style.pause}
          disabled={roll}
          onClick={() => props.playbackControl('pause')}
        >
          Pause
        </Button>
      </div>
      <div className={style.trackContainer}>
        <Button
          width={bigSize}
          {...defProps}
          leftIcon={<ArrowBackIcon />}
          className={style.prev}
          disabled={roll}
          onClick={() => props.playbackControl('previous')}
        >
          Prev
        </Button>
        <Button
          width={bigSize}
          {...defProps}
          rightIcon={<ArrowForwardIcon />}
          className={style.next}
          disabled={roll}
          onClick={() => props.playbackControl('next')}
        >
          Next
        </Button>
        <Button
          width={bigSize}
          colorScheme='blue'
          className={style.reset}
          onClick={() => props.playbackControl('roll')}
        >
          Roll
        </Button>
      </div>
    </div>
  );
}
