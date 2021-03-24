import { Button } from '@chakra-ui/button';
import style from './PlaybackControl.module.css';
import Countdown from '../../common/components/countdown/Countdown';

export default function PlaybackControl() {
  return (
    <div className={style.mainContainer}>
      <div className={style.timeContainer}>
        <div className={style.timer}>
          <Countdown time={15} small />
        </div>
        <Button width={50} colorScheme='blackAlpha' className={style.minu1}>
          -1
        </Button>
        <Button width={50} colorScheme='blackAlpha' className={style.plus1}>
          +1
        </Button>
        <Button width={50} colorScheme='blackAlpha' className={style.minu5}>
          -5
        </Button>
        <Button width={50} colorScheme='blackAlpha' className={style.plus5}>
          +5
        </Button>
      </div>

      <div className={style.playbackContainer}>
        <Button width={120} colorScheme='green' className={style.start}>
          Start
        </Button>
        <Button width={120} colorScheme='orange' className={style.pause}>
          Pause
        </Button>
        <Button width={120} colorScheme='yellow' className={style.reset}>
          Reset
        </Button>
      </div>
      <div className={style.trackContainer}>
        <Button width={100} colorScheme='blackAlpha' className={style.prev}>
          Prev
        </Button>
        <Button width={100} colorScheme='blackAlpha' className={style.next}>
          Next
        </Button>
        <Button width={100} colorScheme='blackAlpha' className={style.reset}>
          Roll
        </Button>
      </div>
    </div>
  );
}
