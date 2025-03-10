import { PropsWithChildren } from 'react';
import { Tooltip } from '@chakra-ui/react';
import { Playback, TimerPhase } from 'ontime-types';

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

  const isRolling = playback === Playback.Roll;
  const isWaiting = timer.phase === TimerPhase.Pending;
  const isOvertime = timer.phase === TimerPhase.Overtime;
  const hasAddedTime = Boolean(timer.addedTime);

  const rollLabel = (() => {
    if (!isRolling) {
      return '';
    }
    if (isWaiting) {
      return 'Roll: Countdown to start';
    }

    return 'Roll mode active';
  })();

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
      {children}
    </div>
  );
}
