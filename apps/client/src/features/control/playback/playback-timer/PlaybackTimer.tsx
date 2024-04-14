import { Tooltip } from '@chakra-ui/react';
import { Playback } from 'ontime-types';
import { dayInMs, millisToMinutes, millisToSeconds, millisToString } from 'ontime-utils';

import { useTimer } from '../../../../common/hooks/useSocket';
import AddTime from '../add-time/AddTime';
import TimerDisplay from '../timer-display/TimerDisplay';

import style from './PlaybackTimer.module.scss';

interface PlaybackTimerProps {
  playback: Playback;
}

export default function PlaybackTimer(props: PlaybackTimerProps) {
  const { playback } = props;
  const timer = useTimer();

  const started = millisToString(timer.startedAt);
  const expectedFinish = timer.expectedFinish !== null ? timer.expectedFinish % dayInMs : null;
  const finish = millisToString(expectedFinish);

  const isRolling = playback === Playback.Roll;
  const isStopped = playback === Playback.Stop;
  const isWaiting = timer.secondaryTimer !== null && timer.secondaryTimer > 0 && timer.current === null;
  const disableButtons = isStopped || isRolling;
  const isOvertime = timer.current !== null && timer.current < 0;
  const hasAddedTime = Boolean(timer.addedTime);

  const rollLabel = isRolling ? 'Roll mode active' : '';

  const resolveAddedTimeLabel = () => {
    function resolveClosestUnit(ms: number) {
      if (ms < 6000) {
        return `${millisToSeconds(ms)} seconds`;
      } else if (ms < 12000) {
        return '1 minute';
      } else {
        return `${millisToMinutes(ms)} minutes`;
      }
    }

    if (timer.addedTime > 0) {
      return `Added ${resolveClosestUnit(timer.addedTime)}`;
    }

    if (timer.addedTime < 0) {
      return `Removed ${resolveClosestUnit(timer.addedTime)}`;
    }

    return '';
  };

  const addedTimeLabel = resolveAddedTimeLabel();

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
      <TimerDisplay time={isWaiting ? timer.secondaryTimer : timer.current} />
      <div className={style.status}>
        {isWaiting ? (
          <span className={style.rolltag}>Roll: Countdown to start</span>
        ) : (
          <>
            <span className={style.start}>
              <span className={style.tag}>Started at</span>
              <span className={style.time}>{started}</span>
            </span>
            <span className={style.finish}>
              <span className={style.tag}>Expect end</span>
              <span className={style.time}>{finish}</span>
            </span>
          </>
        )}
      </div>
      <AddTime disableButtons={disableButtons} />
    </div>
  );
}
