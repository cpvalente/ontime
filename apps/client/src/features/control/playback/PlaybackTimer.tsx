import { Tooltip } from '@chakra-ui/react';
import { Playback } from 'ontime-types';

import TimerDisplay from '../../../common/components/timer-display/TimerDisplay';
import { setPlayback, useTimer } from '../../../common/hooks/useSocket';
import { millisToMinutes } from '../../../common/utils/dateConfig';
import { tooltipDelayMid } from '../../../ontimeConfig';

import TapButton from './TapButton';

import style from './PlaybackControl.module.scss';
import { millisToString } from 'ontime-utils';

interface PlaybackTimerProps {
  playback: Playback;
}

export default function PlaybackTimer(props: PlaybackTimerProps) {
  const { playback } = props;
  const data = useTimer();

  // TODO: checkout typescript in utilities
  const started = millisToString(data.timer.startedAt);
  const finish = millisToString(data.timer.expectedFinish);
  const isRolling = playback === Playback.Roll;
  const isStopped = playback === Playback.Stop;
  const isWaiting = data.timer.secondaryTimer !== null && data.timer.secondaryTimer > 0 && data.timer.current === null;
  const disableButtons = isStopped || isRolling;
  const isOvertime = data.timer.current !== null && data.timer.current < 0;
  const hasAddedTime = Boolean(data.timer.addedTime);

  const rollLabel = isRolling ? 'Roll mode active' : '';
  const addedTimeLabel = hasAddedTime ? `Added ${millisToMinutes(data.timer.addedTime)} minutes` : '';

  return (
    <div className={style.timeContainer}>
      <div className={style.indicators}>
        <Tooltip label={rollLabel}>
          <div className={isRolling ? style.indRollActive : style.indRoll} />
        </Tooltip>
        <div className={isOvertime ? style.indNegativeActive : style.indNegative} />
        <Tooltip label={addedTimeLabel}>
          <div className={hasAddedTime ? style.indDelayActive : style.indDelay} />
        </Tooltip>
      </div>
      <div className={style.timer}>
        <TimerDisplay time={isWaiting ? data.timer.secondaryTimer : data.timer.current} />
      </div>
      {isWaiting ? (
        <div className={style.roll}>
          <span className={style.rolltag}>Roll: Countdown to start</span>
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
          <TapButton onClick={() => setPlayback.delay(-1)} disabled={disableButtons} square>
            -1
          </TapButton>
        </Tooltip>
        <Tooltip label='Add 1 minute' openDelay={tooltipDelayMid} shouldWrapChildren={disableButtons}>
          <TapButton onClick={() => setPlayback.delay(1)} disabled={disableButtons} square>
            +1
          </TapButton>
        </Tooltip>
        <Tooltip label='Remove 5 minutes' openDelay={tooltipDelayMid} shouldWrapChildren={disableButtons}>
          <TapButton onClick={() => setPlayback.delay(-5)} disabled={disableButtons} square>
            -5
          </TapButton>
        </Tooltip>
        <Tooltip label='Add 5 minutes' openDelay={tooltipDelayMid} shouldWrapChildren={disableButtons}>
          <TapButton onClick={() => setPlayback.delay(+5)} disabled={disableButtons} square>
            +5
          </TapButton>
        </Tooltip>
      </div>
    </div>
  );
}
