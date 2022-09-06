import React, { memo } from 'react';
import { Button } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/react';
import TimerDisplay from 'common/components/countdown/TimerDisplay';
import PropTypes from 'prop-types';

import { useTimerProvider } from '../../../common/hooks/useSocketProvider';
import { millisToSeconds } from '../../../common/utils/dateConfig';
import { stringFromMillis } from '../../../common/utils/time';
import { tooltipDelayMid } from '../../../ontimeConfig';

import style from './PlaybackControl.module.scss';

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.playback === nextProps.playback &&
    prevProps.selectedId === nextProps.selectedId
  );
};

const incrementProps = {
  size: 'sm',
  width: '2.9em',
  colorScheme: 'white',
  variant: 'outline',
};

const PlaybackTimer = (props) => {
  const { playback, handleIncrement, selectedId } = props;
  const timerData = useTimerProvider();
  const started = stringFromMillis(timerData.startedAt, true);
  const finish = stringFromMillis(timerData.expectedFinish, true);
  const isRolling = playback === 'roll';
  const isWaiting = timerData.secondaryTimer > 0 && timerData.current == null;
  const disableButtons = selectedId == null || isRolling;
  const isOvertime = timerData.current < 0;

  return (
    <div className={style.timeContainer}>
      <div className={style.indicators}>
        <Tooltip label='Roll mode active'>
          <div className={isRolling ? style.indRollActive : style.indRoll} />
        </Tooltip>
        <div className={isOvertime ? style.indNegativeActive : style.indNegative} />
        <div className={style.indDelay} />
      </div>
      <div className={style.timer}>
        <TimerDisplay
          time={isWaiting ? millisToSeconds(timerData.secondaryTimer) : millisToSeconds(timerData.current)}
          isNegative={isOvertime}
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
        <Tooltip label='Remove 1 minute' openDelay={tooltipDelayMid} shouldWrapChildren={disableButtons}>
          <Button
            {...incrementProps}
            disabled={disableButtons}
            onClick={() => handleIncrement(-1)}
            _hover={!disableButtons && { bg: '#ebedf0', color: '#333' }}
          >
            -1
          </Button>
        </Tooltip>
        <Tooltip label='Add 1 minute' openDelay={tooltipDelayMid} shouldWrapChildren={disableButtons}>
          <Button
            {...incrementProps}
            disabled={disableButtons}
            onClick={() => handleIncrement(1)}
            _hover={!disableButtons && { bg: '#ebedf0', color: '#333' }}
          >
            +1
          </Button>
        </Tooltip>
        <Tooltip label='Remove 5 minutes' openDelay={tooltipDelayMid} shouldWrapChildren={disableButtons}>
          <Button
            {...incrementProps}
            disabled={disableButtons}
            onClick={() => handleIncrement(-5)}
            _hover={!disableButtons && { bg: '#ebedf0', color: '#333' }}
          >
            -5
          </Button>
        </Tooltip>
        <Tooltip label='Add 5 minutes' openDelay={tooltipDelayMid} shouldWrapChildren={disableButtons}>
          <Button
            {...incrementProps}
            disabled={disableButtons}
            onClick={() => handleIncrement(5)}
            _hover={!disableButtons && { bg: '#ebedf0', color: '#333' }}
          >
            +5
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default memo(PlaybackTimer, areEqual);

PlaybackTimer.propTypes = {
  playback: PropTypes.string,
  handleIncrement: PropTypes.func.isRequired,
  selectedId: PropTypes.string,
};
