import { memo, useMemo } from 'react';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import { useRuntimeOverview, useRuntimePlaybackOverview } from '../../common/hooks/useSocket';
import useProjectData from '../../common/hooks-query/useProjectData';
import { enDash } from '../../common/utils/styleUtils';

import { TimeColumn, TimeRow } from './composite/TimeLayout';
import { calculateEndAndDaySpan, formatedTime, getOffsetText } from './overviewUtils';

import style from './Overview.module.scss';

export default memo(Overview);

function Overview() {
  const { plannedEnd, plannedStart, actualStart, expectedEnd } = useRuntimeOverview();

  const [maybePlannedEnd, maybePlannedDaySpan] = useMemo(() => calculateEndAndDaySpan(plannedEnd), [plannedEnd]);
  const plannedEndText = formatedTime(maybePlannedEnd);

  const [maybeExpectedEnd, maybeExpectedDaySpan] = useMemo(() => calculateEndAndDaySpan(expectedEnd), [expectedEnd]);
  const expectedEndText = formatedTime(maybeExpectedEnd);

  return (
    <div className={style.overview}>
      <ErrorBoundary>
        <TitlesOverview />
        <div className={style.column}>
          <TimeRow label='Planned start' value={formatedTime(plannedStart)} className={style.start} />
          <TimeRow label='Actual start' value={formatedTime(actualStart)} className={style.start} />
        </div>
        <RuntimeOverview />
        <div className={style.column}>
          <TimeRow label='Planned end' value={plannedEndText} className={style.end} daySpan={maybePlannedDaySpan} />
          <TimeRow label='Expected end' value={expectedEndText} className={style.end} daySpan={maybeExpectedDaySpan} />
        </div>
      </ErrorBoundary>
    </div>
  );
}

function TitlesOverview() {
  const { data } = useProjectData();

  return (
    <div className={style.titles}>
      <div className={style.title}>{data.title}</div>
      <div className={style.description}>{data.description}</div>
    </div>
  );
}

function RuntimeOverview() {
  const { clock, numEvents, selectedEventIndex, offset } = useRuntimePlaybackOverview();

  const current = selectedEventIndex !== null ? selectedEventIndex + 1 : enDash;
  const ofTotal = numEvents || enDash;
  const progressText = numEvents ? `${current} of ${ofTotal}` : '-';
  const offsetText = getOffsetText(offset);
  const offsetClasses = offset === null ? undefined : offset > 0 ? style.behind : style.ahead;

  return (
    <>
      <TimeColumn label='Progress' value={progressText} />
      <TimeColumn label='Offset' value={offsetText} className={offsetClasses} />
      <TimeColumn label='Time now' value={formatedTime(clock)} />
    </>
  );
}
