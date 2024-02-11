import { MaybeNumber } from 'ontime-types';
import { millisToString, removeLeadingZero } from 'ontime-utils';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import { useRuntimeOverview, useRuntimePlaybackOverview } from '../../common/hooks/useSocket';
import useProjectData from '../../common/hooks-query/useProjectData';
import { cx } from '../../common/utils/styleUtils';

import style from './Overview.module.scss';

function TimeColumn({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={style.column}>
      <span className={style.label}>{label}</span>
      <span className={cx([style.clock, className])}>{value}</span>
    </div>
  );
}

/**
 * Encapsulates the logic for formatting time in overview
 * @param time
 * @returns
 */
function formattedTime(time: MaybeNumber) {
  return millisToString(time, { fallback: '-- : -- : --' });
}

export default function Overview() {
  const { plannedEnd, plannedStart, actualStart, expectedEnd } = useRuntimeOverview();

  return (
    <div className={style.overview}>
      <ErrorBoundary>
        <TitlesOverview />
        <TimeColumn label='Planned start' value={formattedTime(plannedStart)} className={style.start} />
        <TimeColumn label='Planned end' value={formattedTime(plannedEnd)} className={style.end} />
        <TimeColumn label='Actual start' value={formattedTime(actualStart)} className={style.start} />
        <TimeColumn label='Expected end' value={formattedTime(expectedEnd)} className={style.end} />
        <RuntimeOverview />
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

  const current = selectedEventIndex !== null ? selectedEventIndex + 1 : '-';
  const ofTotal = numEvents || '-';
  const progressText = numEvents ? `${current} of ${ofTotal}` : '-';

  let offsetText = removeLeadingZero(millisToString(offset, { fallback: '-' }));
  if (offsetText !== '-') {
    offsetText = offset < 0 ? `+${offsetText}` : `-${offsetText}`;
  }

  return (
    <>
      <TimeColumn label='Offset' value={offsetText} className={offset < 0 ? style.ahead : style.behind} />
      <TimeColumn label='Progress' value={progressText} />
      <TimeColumn label='Time now' value={formattedTime(clock)} />
    </>
  );
}
