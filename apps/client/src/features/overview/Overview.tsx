import { MaybeNumber } from 'ontime-types';
import { millisToString } from 'ontime-utils';

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
function formattedTime(time: MaybeNumber) {
  return millisToString(time, { fallback: timerPlaceholder });
}

export default function Overview() {
  const { plannedEnd, plannedStart, actualStart, expectedEnd } = useRuntimeOverview();

  return (
    <div className={style.overview}>
      <ErrorBoundary>
        <TitlesOverview />
        <div className={style.column}>
          <TimeRow label='Planned start' value={formattedTime(plannedStart)} className={style.start} />
          <TimeRow label='Actual start' value={formattedTime(actualStart)} className={style.start} />
        </div>
        <RuntimeOverview />
        <div className={style.column}>
          <TimeRow label='Planned end' value={formattedTime(plannedEnd)} className={style.end} />
          <TimeRow label='Expected end' value={formattedTime(expectedEnd)} className={style.end} />
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

  const isAhead = offset <= 0;
  let offsetText = millisToString(Math.abs(offset), { fallback: enDash });
  if (offsetText !== enDash) {
    offsetText = isAhead ? `+${offsetText}` : `${enDash}${offsetText}`;
  }

  return (
    <>
      <TimeColumn label='Progress' value={progressText} />
      <TimeColumn label='Offset' value={offsetText} className={isAhead ? style.ahead : style.behind} />
      <TimeColumn label='Time now' value={formattedTime(clock)} />
    </>
  );
}
