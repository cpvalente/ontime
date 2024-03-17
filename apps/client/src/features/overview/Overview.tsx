import { useMemo } from 'react';
import { MaybeNumber } from 'ontime-types';
import { dayInMs, millisToString } from 'ontime-utils';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import { useRuntimeOverview, useRuntimePlaybackOverview } from '../../common/hooks/useSocket';
import useProjectData from '../../common/hooks-query/useProjectData';
import { enDash, timerPlaceholder } from '../../common/utils/styleUtils';

import { TimeColumn, TimeRow } from './composite/TimeLayout';

import style from './Overview.module.scss';

/**
 * Encapsulates the logic for formatting time in overview
 * @param time
 * @returns
 */
function formatedTime(time: MaybeNumber) {
  return millisToString(time, { fallback: timerPlaceholder });
}

function calculateEndAndDaySpan(end: MaybeNumber): [MaybeNumber, number] {
  let maybeEnd = end;
  let maybeDaySpan = 0;
  if (end !== null) {
    if (end > dayInMs) {
      maybeEnd = end % dayInMs;
      maybeDaySpan = Math.floor(end / dayInMs);
    }
  }
  return [maybeEnd, maybeDaySpan];
}

export default function Overview() {
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

function getOffsetText(offset: MaybeNumber): string {
  if (offset === null) {
    return enDash;
  }
  const isAhead = offset <= 0;
  let offsetText = millisToString(Math.abs(offset), { fallback: enDash });
  if (offsetText !== enDash) {
    offsetText = isAhead ? `+${offsetText}` : `${enDash}${offsetText}`;
  }
  return offsetText;
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
