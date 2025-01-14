import { PropsWithChildren } from 'react';
import { Playback, TimerPhase } from 'ontime-types';
import { dayInMs, millisToString } from 'ontime-utils';

import { Tooltip } from '../../../../common/components/ui/tooltip';
import { useTimer } from '../../../../common/hooks/useSocket';
import { formatDuration } from '../../../../common/utils/time';
import TimerDisplay from '../timer-display/TimerDisplay';

import style from './PlaybackTimer.module.scss';

interface PlaybackTimerProps {
  playback: Playback;
}

function resolveAddedTimeLabel(addedTime: number) {
  if (addedTime > 0) {
    return `Added ${formatDuration(addedTime, false)}`;
  }

  if (addedTime < 0) {
    return `Removed ${formatDuration(Math.abs(addedTime), false)}`;
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
  const isWaiting = timer.phase === TimerPhase.Pending;
  const isOvertime = timer.phase === TimerPhase.Overtime;
  const hasAddedTime = Boolean(timer.addedTime);

  const rollLabel = isRolling ? 'Roll mode active' : '';

  const addedTimeLabel = resolveAddedTimeLabel(timer.addedTime);

  return (
    <div className={style.timeContainer}>
      <div className={style.indicators}>
        <Tooltip content={rollLabel}>
          <div className={style.indicatorRoll} data-active={isRolling} />
        </Tooltip>
        <div className={style.indicatorNegative} data-active={isOvertime} />
        <Tooltip content={addedTimeLabel}>
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
