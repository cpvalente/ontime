import { PropsWithChildren } from 'react';
import { Tooltip } from '@chakra-ui/react';
import { Playback, TimerPhase } from 'ontime-types';
import { millisToMinutes, millisToSeconds } from 'ontime-utils';

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

  const isRolling = playback === Playback.Roll;
  const isWaiting = timer.phase === TimerPhase.Pending;
  const isOvertime = timer.phase === TimerPhase.Overtime;
  const hasAddedTime = Boolean(timer.addedTime);

  // TODO: can we remove this from the timer area?
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
