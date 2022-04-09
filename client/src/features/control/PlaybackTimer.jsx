import React from 'react';
import style from './PlaybackControl.module.scss';
import Countdown from 'common/components/countdown/Countdown';
import { stringFromMillis } from 'ontime-utils/time';
import { Tooltip } from '@chakra-ui/react';
import { Button } from '@chakra-ui/button';
import { memo } from 'react';
import PropTypes from 'prop-types';

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.timer.running === nextProps.timer.running &&
    prevProps.timer.isNegative === nextProps.timer.isNegative &&
    prevProps.timer.expectedFinish === nextProps.timer.expectedFinish &&
    prevProps.timer.startedAt === nextProps.timer.startedAt &&
    prevProps.playback === nextProps.playback &&
    prevProps.timer.secondary === nextProps.timer.secondary &&
    prevProps.selectedId === nextProps.selectedId
  );
};

const incrementProps = {
  size: 'sm',
  width: '2.9em',
  colorScheme: 'whiteAlpha',
  variant: 'outline',
  _focus: { boxShadow: 'none' },
};

const PlaybackTimer = (props) => {
  const { timer, playback, handleIncrement, selectedId } = props;
  const started = stringFromMillis(timer.startedAt, true);
  const finish = stringFromMillis(timer.expectedFinish, true);
  const isRolling = playback === 'roll';
  const isWaiting = timer.secondary > 0 && timer.running == null;
  const disableButtons = selectedId == null || isRolling;

  return (
    <>
      <div className={style.timeContainer}>
        <div className={style.indicators}>
          <Tooltip label='Roll mode active'>
            <div className={isRolling ? style.indRollActive : style.indRoll} />
          </Tooltip>
          <div
            className={timer.isNegative ? style.indNegativeActive : style.indNegative}
          />
          <div className={style.indDelay} />
        </div>
        <div className={style.timer}>
          <Countdown
            time={isWaiting ? timer.secondary : timer.running}
            isNegative={timer.isNegative}
            small
          />
        </div>
        {isWaiting ? (
          <div className={style.roll}>
            <span className={style.rolltag}>Roll: Countdown to start</span>
            <span className={style.time}>FIX</span>
          </div>
        ) : (
          <>
            <div className={style.start}>
              <span className={style.tag}>Started at </span>
              <span className={style.time}>{started}</span>
            </div>
            <div className={style.finish}>
              <span className={style.tag}>Finish at </span>
              <span className={style.time}>{finish}</span>
            </div>
          </>
        )}
        <div className={style.btn}>
          <Tooltip
            label='Remove 1 minute'
            delay={500}
            shouldWrapChildren={disableButtons}
          >
            <Button
              {...incrementProps}
              disabled={disableButtons}
              onClick={() => handleIncrement(-1)}
            >
              -1
            </Button>
          </Tooltip>
          <Tooltip
            label='Add 1 minute'
            delay={500}
            shouldWrapChildren={disableButtons}
          >
            <Button
              {...incrementProps}
              disabled={disableButtons}
              onClick={() => handleIncrement(1)}
            >
              +1
            </Button>
          </Tooltip>
          <Tooltip
            label='Remove 5 minutes'
            delay={500}
            shouldWrapChildren={disableButtons}
          >
            <Button
              {...incrementProps}
              disabled={disableButtons}
              onClick={() => handleIncrement(-5)}
            >
              -5
            </Button>
          </Tooltip>
          <Tooltip
            label='Add 5 minutes'
            delay={500}
            shouldWrapChildren={disableButtons}
          >
            <Button
              {...incrementProps}
              disabled={disableButtons}
              onClick={() => handleIncrement(5)}
            >
              +5
            </Button>
          </Tooltip>
        </div>
      </div>
    </>
  );
};

export default memo(PlaybackTimer, areEqual);

PlaybackTimer.propTypes = {
  timer: PropTypes.object.isRequired,
  playback: PropTypes.string,
  handleIncrement: PropTypes.func.isRequired,
  selectedId: PropTypes.string,
};
