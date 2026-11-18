import { MaybeNumber, Playback, TimerPhase } from 'ontime-types';
import { millisToString } from 'ontime-utils';
import { PropsWithChildren } from 'react';

import AppLink from '../../../../common/components/link/app-link/AppLink';
import useReport from '../../../../common/hooks-query/useReport';
import { useOffsetOverview, useTimerProgress } from '../../../../common/hooks/useSocket';
import { getOffsetState, getOffsetText } from '../../../../common/utils/offset';
import { cx, enDash } from '../../../../common/utils/styleUtils';
import { normaliseWallClock } from '../../../../common/utils/time';
import TimerDisplay from '../timer-display/TimerDisplay';
import TimerIndicators from '../timer-indicators/TimerIndicators';

import style from './PlaybackTimer.module.scss';

export default function PlaybackTimer({ children }: PropsWithChildren) {
  'use memo';
  const timer = useTimerProgress();
  const { offset } = useOffsetOverview();

  const isWaiting = timer.phase === TimerPhase.Pending;

  return (
    <div className={style.container}>
      <div className={style.timeContainer}>
        <div className={style.timerRow}>
          <TimerIndicators
            playback={timer.playback}
            phase={timer.phase}
            addedTime={timer.addedTime}
            isCountToEnd={timer.isCountToEnd}
          />
          <TimerDisplay
            className={style.timerDisplay}
            time={isWaiting ? timer.secondaryTimer : timer.current}
            phase={timer.phase}
          />
        </div>
        <div className={style.status}>
          {isWaiting ? (
            <span className={style.rolltag}>Roll: Countdown to start</span>
          ) : (
            <RunningStatus
              startedAt={timer.startedAt}
              expectedFinish={timer.expectedFinish}
              offset={offset}
              isStopped={timer.playback === Playback.Stop}
              isCountToEnd={timer.isCountToEnd}
              isOvertime={timer.phase === TimerPhase.Overtime}
            />
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

interface RunningStatusProps {
  startedAt: MaybeNumber;
  expectedFinish: MaybeNumber;
  offset: number;
  isStopped: boolean;
  isCountToEnd: boolean;
  isOvertime: boolean;
}

function RunningStatus({ startedAt, expectedFinish, offset, isStopped, isCountToEnd, isOvertime }: RunningStatusProps) {
  const { data } = useReport();
  const hasReport = Object.keys(data).length > 0;

  if (isStopped && hasReport) {
    return <AppLink search='settings=sharing__report'>Go to report management</AppLink>;
  }

  const started = isStopped ? enDash : millisToString(startedAt);
  const finish = isStopped
    ? enDash
    : millisToString(expectedFinish === null ? null : normaliseWallClock(expectedFinish));
  const offsetValue = isStopped ? null : offset;
  const offsetText = offsetValue === 0 ? '0:00' : getOffsetText(offsetValue);

  return (
    <>
      <div className={style.cell}>
        <span className={style.tag}>Started</span>
        <span className={style.time} data-state={isStopped ? 'muted' : undefined}>
          {started}
        </span>
      </div>
      <div className={cx([style.cell, style.cellOffset])}>
        <span className={style.tag}>Offset</span>
        <span className={style.time} data-state={getOffsetState(offsetValue)}>
          {offsetText}
        </span>
      </div>
      <div className={cx([style.cell, style.cellEnd])}>
        <span className={cx([style.tag, isOvertime && style.tagOvertime])}>
          {isCountToEnd ? 'Scheduled end' : 'Expected end'}
        </span>
        <span className={style.time} data-state={isStopped ? 'muted' : undefined}>
          {finish}
        </span>
      </div>
    </>
  );
}
