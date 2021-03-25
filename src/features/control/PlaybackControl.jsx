import { Button } from '@chakra-ui/button';
import style from './PlaybackControl.module.css';
import Countdown from '../../common/components/countdown/Countdown';
import { useState } from 'react';
import { clamp } from '../../app/utils';
import { ArrowBackIcon, ArrowForwardIcon } from '@chakra-ui/icons';

export default function PlaybackControl() {
  const [time, setTime] = useState(15);
  const [roll, setRoll] = useState(false);

  const incrementTimer = (amount = 1) => {
    const t = clamp(time + amount * 60, 0, 3600);
    setTime(t);
  };

  const defProps = {
    colorScheme: 'blackAlpha',
    variant: 'outline',
  };

  const smallSize = 50;
  const midSize = 100;
  const bigSize = 120;

  return (
    <div className={style.mainContainer}>
      <div className={style.timeContainer}>
        <div className={style.timer}>
          <Countdown time={time} small />
        </div>
        {/* <Button
          width={smallSize}
          {...defProps}
          className={style.minu1}
          disabled={roll}
          onClick={() => incrementTimer(-1)}
        >
          -1
        </Button>
        <Button
          width={smallSize}
          {...defProps}
          className={style.plus1}
          disabled={roll}
          onClick={() => incrementTimer()}
        >
          +1
        </Button>
        <Button
          width={smallSize}
          {...defProps}
          className={style.minu5}
          disabled={roll}
          onClick={() => incrementTimer(5)}
        >
          -5
        </Button>
        <Button
          width={smallSize}
          {...defProps}
          className={style.plus5}
          disabled={roll}
          onClick={() => incrementTimer(5)}
        >
          +5
        </Button> */}
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
        {/* <Button
          width={bigSize}
          colorScheme='yellow'
          className={style.reset}
          disabled={roll}
        >
          Reset
        </Button> */}
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
