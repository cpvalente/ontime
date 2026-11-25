import { MaybeNumber, Playback, TimerPhase } from 'ontime-types';
import { millisToString } from 'ontime-utils';
import { PropsWithChildren } from 'react';

import AppLink from '../../../../common/components/link/app-link/AppLink';
import Tooltip from '../../../../common/components/tooltip/Tooltip';
import useReport from '../../../../common/hooks-query/useReport';
import { useOffsetOverview, useTimerProgress } from '../../../../common/hooks/useSocket';
import { getOffsetState, getOffsetText } from '../../../../common/utils/offset';
import { cx, enDash } from '../../../../common/utils/styleUtils';
import { formatDuration, normaliseWallClock } from '../../../../common/utils/time';
import TimerDisplay from '../timer-display/TimerDisplay';

import style from './PlaybackTimer.module.scss';

function resolveAddedTimeLabel(addedTime: number) {
  if (addedTime > 0) {
    return `Added ${formatDuration(addedTime, false)}`;
  }

  if (addedTime < 0) {
    return `Removed ${formatDuration(Math.abs(addedTime), false)}`;
  }

  return '';
}

export default function PlaybackTimer({ children }: PropsWithChildren) {
  'use memo';
  const timer = useTimerProgress();
  const { offset, isReset } = useOffsetOverview();

  const isRolling = timer.playback === Playback.Roll;
  const isWaiting = timer.phase === TimerPhase.Pending;
  const isOvertime = timer.phase === TimerPhase.Overtime;
  const hasAddedTime = Boolean(timer.addedTime);
  const rollLabel = isRolling ? 'Roll mode active' : '';
  const addedTimeLabel = resolveAddedTimeLabel(timer.addedTime);

  return (
    <div className={style.container}>
      <div className={style.timeContainer}>
        <div className={style.timerRow}>
          <div className={style.indicators}>
            <Tooltip text={rollLabel} render={<div />} className={style.indicatorRoll} data-active={isRolling} />
            <div className={style.indicatorNegative} data-active={isOvertime} />
            <Tooltip
              text={addedTimeLabel}
              render={<div />}
              className={style.indicatorDelay}
              data-active={hasAddedTime}
            />
          </div>
          <TimerDisplay
            className={style.timerDisplay}
            time={isWaiting ? timer.secondaryTimer : timer.current}
            phase={timer.phase}
          />
        </div>
        <div className={style.status}>
          <RunningStatus
            startedAt={timer.startedAt}
            expectedFinish={timer.expectedFinish}
            offset={offset}
            isReset={isReset}
            isStopped={timer.playback === Playback.Stop}
            isCountToEnd={timer.isCountToEnd}
            isOvertime={isOvertime}
            isWaiting={isWaiting}
          />
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
  isReset: boolean;
  isStopped: boolean;
  isCountToEnd: boolean;
  isOvertime: boolean;
  isWaiting: boolean;
}

function RunningStatus({
  startedAt,
  expectedFinish,
  offset,
  isReset,
  isStopped,
  isCountToEnd,
  isOvertime,
  isWaiting,
}: RunningStatusProps) {
  const { data } = useReport();
  const hasReport = Object.keys(data).length > 0;
  const showReportLink = isStopped && hasReport;
  // the roll tag and the report link sit over the times, which stay in place and keep the row's size
  const isCovered = isWaiting || showReportLink;

  const started = isStopped ? enDash : millisToString(startedAt);
  const finish = isStopped
    ? enDash
    : millisToString(expectedFinish === null ? null : normaliseWallClock(expectedFinish));
  const offsetValue = isStopped ? null : offset;
  const offsetText = offsetValue === 0 ? '0:00' : getOffsetText(offsetValue);

  return (
    <>
      {isWaiting && (
        <span className={style.overlay} data-tone='roll'>
          Roll: Countdown to start
        </span>
      )}
      {showReportLink && (
        <span className={style.overlay}>
          <AppLink search='settings=sharing__report'>Go to report management</AppLink>
        </span>
      )}
      <div className={style.cell} data-covered={isCovered || undefined}>
        <span className={style.tag}>Started</span>
        <span className={style.time} data-state={isStopped ? 'muted' : undefined}>
          {started}
        </span>
      </div>
      <div className={cx([style.cell, style.cellOffset])} data-covered={isCovered || undefined}>
        <span className={style.tag}>
          Offset
          {isReset && <span className={style.resetDot} />}
        </span>
        <span className={style.time} data-state={getOffsetState(offsetValue)}>
          {offsetText}
        </span>
      </div>
      <div className={cx([style.cell, style.cellEnd])} data-covered={isCovered || undefined}>
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
