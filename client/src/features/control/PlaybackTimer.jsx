import style from './PlaybackControl.module.css';
import Countdown from 'common/components/countdown/Countdown';
import { stringFromMillis } from 'common/dateConfig';
import { Button } from '@chakra-ui/button';
import { memo } from 'react';

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.timer.running === nextProps.timer.running &&
    prevProps.timer.expectedFinish === nextProps.timer.expectedFinish &&
    prevProps.timer.startedAt === nextProps.timer.startedAt &&
    prevProps.playback === nextProps.playback
  );
};

const PlaybackTimer = (props) => {
  const { timer, playback, handleIncrement } = props;
  const started = stringFromMillis(timer.startedAt, true);
  const finish = stringFromMillis(timer.expectedFinish, true);
  const isNegative = timer.running < 0;
  const isDelayed = false;
  const isRolling = playback === 'roll';

  const incrementProps = {
    size: 'sm',
    width: '2.9em',
    colorScheme: 'whiteAlpha',
    variant: 'outline',
    _focus: { boxShadow: 'none' },
  };

  return (
    <>
      <div className={style.timeContainer}>
        <div className={style.indicators}>
          <div className={isRolling ? style.indRollActive : style.indRoll} />
          <div
            className={isNegative ? style.indNegativeActive : style.indNegative}
          />
          <div className={style.indDelay} />
        </div>
        <div className={style.timer}>
          <Countdown time={timer?.running} small negative={isNegative} />
        </div>
        <div className={style.start}>
          <span className={style.tag}>Started at </span>
          <span className={style.time}>{started}</span>
        </div>
        <div className={style.finish}>
          <span className={style.tag}>Finish at </span>
          <span className={style.time}>{finish}</span>
        </div>
        <div className={style.btn}>
          <Button
            {...incrementProps}
            disabled={isRolling}
            onClick={() => handleIncrement(-1)}
          >
            -1
          </Button>
          <Button
            {...incrementProps}
            disabled={isRolling}
            onClick={() => handleIncrement(1)}
          >
            +1
          </Button>
          <Button
            {...incrementProps}
            disabled={isRolling}
            onClick={() => handleIncrement(-5)}
          >
            -5
          </Button>
          <Button
            {...incrementProps}
            disabled={isRolling}
            onClick={() => handleIncrement(5)}
          >
            +5
          </Button>
        </div>
      </div>
    </>
  );
};

export default memo(PlaybackTimer, areEqual);
