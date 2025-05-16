import { memo, PropsWithChildren, ReactNode, useMemo } from 'react';
import { Playback } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import { useIsOnline, useRuntimeOverview, useRuntimePlaybackOverview, useTimer } from '../../common/hooks/useSocket';
import useProjectData from '../../common/hooks-query/useProjectData';
import { cx, enDash, timerPlaceholder } from '../../common/utils/styleUtils';

import { TimeColumn, TimeRow } from './composite/TimeLayout';
import { calculateEndAndDaySpan, formatedTime, getOffsetText } from './overviewUtils';

import style from './Overview.module.scss';

export const EditorOverview = memo(_EditorOverview);

function _EditorOverview({ children }: PropsWithChildren) {
  const { plannedEnd, plannedStart, actualStart, expectedEnd } = useRuntimeOverview();

  const [maybePlannedEnd, maybePlannedDaySpan] = useMemo(() => calculateEndAndDaySpan(plannedEnd), [plannedEnd]);
  const plannedEndText = formatedTime(maybePlannedEnd);

  const [maybeExpectedEnd, maybeExpectedDaySpan] = useMemo(() => calculateEndAndDaySpan(expectedEnd), [expectedEnd]);
  const expectedEndText = formatedTime(maybeExpectedEnd);

  return (
    <OverviewWrapper navElements={children}>
      <TitlesOverview />
      <div>
        <TimeRow
          label='Planned start'
          value={formatedTime(plannedStart)}
          className={style.start}
          muted={plannedStart === null}
        />
        <TimeRow
          label='Actual start'
          value={formatedTime(actualStart)}
          className={style.start}
          muted={actualStart === null}
        />
      </div>
      <ProgressOverview />
      <CurrentBlockOverview />
      <RuntimeOverview />
      <div>
        <TimeRow
          label='Planned end'
          value={plannedEndText}
          className={style.end}
          daySpan={maybePlannedDaySpan}
          muted={maybePlannedEnd === null}
        />
        <TimeRow
          label='Expected end'
          value={expectedEndText}
          className={style.end}
          daySpan={maybeExpectedDaySpan}
          muted={maybeExpectedEnd === null}
        />
      </div>
    </OverviewWrapper>
  );
}

export const CuesheetOverview = memo(_CuesheetOverview);

function _CuesheetOverview({ children }: PropsWithChildren) {
  const { plannedEnd, expectedEnd } = useRuntimeOverview();

  const [maybePlannedEnd, maybePlannedDaySpan] = useMemo(() => calculateEndAndDaySpan(plannedEnd), [plannedEnd]);
  const plannedEndText = formatedTime(maybePlannedEnd);

  const [maybeExpectedEnd, maybeExpectedDaySpan] = useMemo(() => calculateEndAndDaySpan(expectedEnd), [expectedEnd]);
  const expectedEndText = formatedTime(maybeExpectedEnd);

  return (
    <OverviewWrapper navElements={children}>
      <TitlesOverview />
      <TimerOverview />
      <RuntimeOverview />
      <div>
        <TimeRow
          label='Planned end'
          value={plannedEndText}
          className={style.end}
          daySpan={maybePlannedDaySpan}
          muted={maybePlannedEnd === null}
        />
        <TimeRow
          label='Expected end'
          value={expectedEndText}
          className={style.end}
          daySpan={maybeExpectedDaySpan}
          muted={maybeExpectedEnd === null}
        />
      </div>
    </OverviewWrapper>
  );
}

interface OverviewWrapperProps {
  navElements: ReactNode;
}

function OverviewWrapper({ navElements, children }: PropsWithChildren<OverviewWrapperProps>) {
  const { isOnline } = useIsOnline();
  return (
    <div className={cx([style.overview, !isOnline && style.isOffline])}>
      <ErrorBoundary>
        <div className={style.nav}>{navElements}</div>
        <div className={style.info}>{children}</div>
      </ErrorBoundary>
    </div>
  );
}

function TitlesOverview() {
  const { data } = useProjectData();

  if (!data.title && !data.description) {
    return null;
  }

  return (
    <div>
      <div className={style.title}>{data.title}</div>
      <div className={style.description}>{data.description}</div>
    </div>
  );
}

function CurrentBlockOverview() {
  const { currentBlock, clock } = useRuntimePlaybackOverview();

  const timeInBlock = formatedTime(currentBlock.startedAt === null ? null : clock - currentBlock.startedAt);

  return (
    <TimeColumn
      label='Time in block'
      value={timeInBlock}
      className={style.clock}
      muted={currentBlock.startedAt === null}
    />
  );
}

function TimerOverview() {
  const { current } = useTimer();

  const display = millisToString(current, { fallback: timerPlaceholder });

  return <TimeColumn label='Running timer' value={display} muted={current === null} />;
}

function ProgressOverview() {
  const { numEvents, selectedEventIndex } = useRuntimePlaybackOverview();

  const current = selectedEventIndex !== null ? selectedEventIndex + 1 : enDash;
  const ofTotal = numEvents || enDash;
  const progressText = numEvents ? `${current} of ${ofTotal}` : '-';

  return <TimeColumn label='Progress' value={progressText} />;
}

function RuntimeOverview() {
  const { clock, offset, playback } = useRuntimePlaybackOverview();

  const offsetText = getOffsetText(offset);
  const offsetClasses = cx([style.offset, playback !== Playback.Stop && (offset < 0 ? style.behind : style.ahead)]);

  return (
    <>
      <TimeColumn label='Offset' value={offsetText} className={offsetClasses} testId='offset' />
      <TimeColumn label='Time now' value={formatedTime(clock)} />
    </>
  );
}
