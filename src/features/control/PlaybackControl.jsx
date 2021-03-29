import { Button } from '@chakra-ui/button';
import style from './PlaybackControl.module.css';
import Countdown from '../../common/components/countdown/Countdown';
import { useState } from 'react';
import { ArrowBackIcon, ArrowForwardIcon } from '@chakra-ui/icons';

export default function PlaybackControl() {
  const [time] = useState(15);
  const [roll, setRoll] = useState(false);

  const defProps = {
    colorScheme: 'blackAlpha',
    variant: 'outline',
  };

  const bigSize = 120;

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
        >
          Start
        </Button>
        <Button
          width={bigSize}
          colorScheme='orange'
          className={style.pause}
          disabled={roll}
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
        >
          Prev
        </Button>
        <Button
          width={bigSize}
          {...defProps}
          rightIcon={<ArrowForwardIcon />}
          className={style.next}
          disabled={roll}
        >
          Next
        </Button>
        <Button
          width={bigSize}
          colorScheme='blue'
          className={style.reset}
          onClick={() => setRoll(!roll)}
        >
          Roll
        </Button>
      </div>
    </div>
  );
}
