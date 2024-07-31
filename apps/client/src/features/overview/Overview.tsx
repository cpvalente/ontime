import { memo, useMemo } from 'react';
import { millisToString } from 'ontime-utils';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import { useRuntimeOverview, useRuntimePlaybackOverview, useTimer } from '../../common/hooks/useSocket';
import useProjectData from '../../common/hooks-query/useProjectData';
import { enDash } from '../../common/utils/styleUtils';

import { TimeColumn, TimeRow } from './composite/TimeLayout';
import { calculateEndAndDaySpan, formatedTime, getOffsetText } from './overviewUtils';

import style from './Overview.module.scss';

export const EditorOverview = memo(_EditorOverview);

function _EditorOverview({ children }: { children: React.ReactNode }) {
  const { plannedEnd, plannedStart, actualStart, expectedEnd } = useRuntimeOverview();

  const [maybePlannedEnd, maybePlannedDaySpan] = useMemo(() => calculateEndAndDaySpan(plannedEnd), [plannedEnd]);
  const plannedEndText = formatedTime(maybePlannedEnd);

  const [maybeExpectedEnd, maybeExpectedDaySpan] = useMemo(() => calculateEndAndDaySpan(expectedEnd), [expectedEnd]);
  const expectedEndText = formatedTime(maybeExpectedEnd);

  return (
    <div className={style.overview}>
      <ErrorBoundary>
        <div className={style.nav}>{children}</div>
        <div className={style.info}>
          <TitlesOverview />
          <div>
            <TimeRow label='Planned start' value={formatedTime(plannedStart)} className={style.start} />
            <TimeRow label='Actual start' value={formatedTime(actualStart)} className={style.start} />
          </div>
          <ProgressOverview />
          <CurrentBlockOverview />
          <RuntimeOverview />
          <div>
            <TimeRow label='Planned end' value={plannedEndText} className={style.end} daySpan={maybePlannedDaySpan} />
            <TimeRow
              label='Expected end'
              value={expectedEndText}
              className={style.end}
              daySpan={maybeExpectedDaySpan}
            />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}

export const CuesheetOverview = memo(_CuesheetOverview);

function _CuesheetOverview({ children }: { children: React.ReactNode }) {
  const { plannedEnd, expectedEnd } = useRuntimeOverview();

  const [maybePlannedEnd, maybePlannedDaySpan] = useMemo(() => calculateEndAndDaySpan(plannedEnd), [plannedEnd]);
  const plannedEndText = formatedTime(maybePlannedEnd);

  const [maybeExpectedEnd, maybeExpectedDaySpan] = useMemo(() => calculateEndAndDaySpan(expectedEnd), [expectedEnd]);
  const expectedEndText = formatedTime(maybeExpectedEnd);

  return (
    <div className={style.overview}>
      <ErrorBoundary>
        <div className={style.nav}>{children}</div>
        <div className={style.info}>
          <TitlesOverview />
          <TimerOverview />
          <RuntimeOverview />
          <div>
            <TimeRow label='Planned end' value={plannedEndText} className={style.end} daySpan={maybePlannedDaySpan} />
            <TimeRow
              label='Expected end'
              value={expectedEndText}
              className={style.end}
              daySpan={maybeExpectedDaySpan}
            />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}

function TitlesOverview() {
  const { data } = useProjectData();

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

  return <TimeColumn label='Time in block' value={timeInBlock} className={style.clock} />;
}

function TimerOverview() {
  const { current } = useTimer();

  const display = millisToString(current);

  return <TimeColumn label='Running timer' value={display} />;
}

function ProgressOverview() {
  const { numEvents, selectedEventIndex } = useRuntimePlaybackOverview();

  const current = selectedEventIndex !== null ? selectedEventIndex + 1 : enDash;
  const ofTotal = numEvents || enDash;
  const progressText = numEvents ? `${current} of ${ofTotal}` : '-';

  return <TimeColumn label='Progress' value={progressText} />;
}

function RuntimeOverview() {
  const { clock, offset } = useRuntimePlaybackOverview();

  const offsetText = getOffsetText(offset);
  const offsetClasses = offset === null ? undefined : offset <= 0 ? style.behind : style.ahead;

  return (
    <>
      <TimeColumn label='Offset' value={offsetText} className={offsetClasses} />
      <TimeColumn label='Time now' value={formatedTime(clock)} />
    </>
  );
}
