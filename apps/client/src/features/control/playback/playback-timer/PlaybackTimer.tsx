import { PropsWithChildren } from 'react';
import { Tooltip } from '@chakra-ui/react';
import { Playback, TimerPhase } from 'ontime-types';
import { dayInMs, millisToMinutes, millisToSeconds, millisToString } from 'ontime-utils';

import { useTimer } from '../../../../common/hooks/useSocket';
import TimerDisplay from '../timer-display/TimerDisplay';

import style from './PlaybackTimer.module.scss';

interface PlaybackTimerProps {
  playback: Playback;
}

function resolveAddedTimeLabel(addedTime: number) {
  function resolveClosestUnit(ms: number) {
    if (ms < 6000) {
      return `${millisToSeconds(ms)} seconds`;
    } else if (ms < 12000) {
      return '1 minute';
    } else {
      return `${millisToMinutes(ms)} minutes`;
    }
  }

  if (addedTime > 0) {
    return `Added ${resolveClosestUnit(addedTime)}`;
  }

  if (addedTime < 0) {
    return `Removed ${resolveClosestUnit(addedTime)}`;
  }

  return '';
}

export default function PlaybackTimer(props: PropsWithChildren<PlaybackTimerProps>) {
  const { playback, children } = props;
  const timer = useTimer();

  const started = millisToString(timer.startedAt);
  const expectedFinish = timer.expectedFinish !== null ? timer.expectedFinish % dayInMs : null;
  const finish = millisToString(expectedFinish);

  const isRolling = playback === Playback.Roll;
  const isWaiting = timer.secondaryTimer !== null && timer.secondaryTimer > 0 && timer.current === null;
  const isOvertime = timer.phase === TimerPhase.Negative;
  const hasAddedTime = Boolean(timer.addedTime);

  const rollLabel = isRolling ? 'Roll mode active' : '';

  const addedTimeLabel = resolveAddedTimeLabel(timer.addedTime);

  return (
    <div className={style.timeContainer}>
      <div className={style.indicators}>
        <Tooltip label={rollLabel}>
          <div className={style.indicatorRoll} data-active={isRolling} />
        </Tooltip>
        <div className={style.indicatorNegative} data-active={isOvertime} />
        <Tooltip label={addedTimeLabel}>
          <div className={style.indicatorDelay} data-active={hasAddedTime} />
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
      {children}
    </div>
  );
}
