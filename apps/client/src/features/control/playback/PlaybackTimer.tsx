import { Tooltip } from '@chakra-ui/react';
import { Playback } from 'ontime-types';

import TimerDisplay from '../../../common/components/timer-display/TimerDisplay';
import { setPlayback, useTimer } from '../../../common/hooks/useSocket';
import { millisToMinutes } from '../../../common/utils/dateConfig';
import { stringFromMillis } from '../../../common/utils/time';
import { tooltipDelayMid } from '../../../ontimeConfig';

import TapButton from './TapButton';

import style from './PlaybackControl.module.scss';

interface PlaybackTimerProps {
  playback: Playback;
  selectedId: string | null;
}

export default function PlaybackTimer(props: PlaybackTimerProps) {
  const { playback, selectedId } = props;
  const { data: timerData } = useTimer();

  // TODO: checkout typescript in utilities
  const started = stringFromMillis(timerData?.startedAt, true);
  const finish = stringFromMillis(timerData.expectedFinish, true);
  const isRolling = playback === 'roll';
  const isWaiting = timerData.secondaryTimer !== null && timerData.secondaryTimer > 0 && timerData.current === null;
  const disableButtons = selectedId === null || isRolling;
  const isOvertime = timerData.current !== null && timerData.current < 0;
  const hasAddedTime = Boolean(timerData.addedTime);

  const rollLabel = isRolling ? 'Roll mode active' : '';
  const addedTimeLabel = hasAddedTime ? `Added ${millisToMinutes(timerData.addedTime)} minutes` : '';

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
        <TimerDisplay time={isWaiting ? timerData.secondaryTimer : timerData.current} />
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
