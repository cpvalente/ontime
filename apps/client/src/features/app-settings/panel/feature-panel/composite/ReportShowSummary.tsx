import type { MaybeNumber, ShowReport } from 'ontime-types';

import { cx, enDash } from '../../../../../common/utils/styleUtils';
import { formatDuration, formatTime } from '../../../../../common/utils/time';
import { formatOffset, getShowOffsets, offsetTone } from '../reportSettings.utils';
import type { RunSummary } from '../reportSettings.utils';

import style from './ReportShowSummary.module.scss';

interface ReportShowSummaryProps {
  rundownTitle: string;
  show: ShowReport;
  summary: RunSummary;
}

/**
 * Leads the report with whether the show ran to the length it was planned for.
 *
 * Running time is the headline rather than finishing time because it is the
 * part the team controls and the part that carries into the next run of the
 * same rundown. Finishing time is the other question a report is asked, and
 * the two can point opposite ways, so it stays beside it as its own row
 * rather than being folded into a single figure.
 */
export default function ReportShowSummary({ rundownTitle, show, summary }: ReportShowSummaryProps) {
  const offsets = getShowOffsets(show);

  /**
   * A show that stopped early has no meaningful end: its last event is simply
   * where it got to. Measuring that against the plan would report a show which
   * never finished as having come in comfortably short.
   */
  const didReachEnd = summary.eventsRun > 0 && summary.eventsRun === summary.eventsPlanned;
  const hasPlan = offsets.startOffset !== null;

  return (
    <div className={style.inset}>
      <section className={style.summary} aria-labelledby='report-summary-title'>
        <h4 id='report-summary-title' className={style.title}>
          {rundownTitle || 'Untitled rundown'}
        </h4>

        <div className={style.body}>
          <div className={style.headline}>
            <span className={style.headlineLabel}>{didReachEnd ? 'Show duration' : 'Show incomplete'}</span>
            {didReachEnd && offsets.durationOffset !== null ? (
              <span className={cx([style.headlineValue, style[offsetTone(offsets.durationOffset)]])}>
                {formatOffset(offsets.durationOffset)}
              </span>
            ) : (
              <span className={style.unavailable}>The show did not reach the end of the rundown.</span>
            )}
          </div>

          <dl className={style.metrics}>
            {hasPlan && (
              <Metric
                label='Started'
                planned={formatMaybeTime(show.plannedStart)}
                actual={formatMaybeTime(show.actualStart)}
                offset={offsets.startOffset}
              />
            )}
            {hasPlan && didReachEnd && (
              <Metric
                label='Ended'
                planned={formatMaybeTime(show.plannedEnd)}
                actual={formatMaybeTime(show.actualEnd)}
                offset={offsets.endOffset}
              />
            )}
            {didReachEnd && (
              <Metric
                label='Duration'
                planned={formatMaybeDuration(show.plannedDuration)}
                actual={formatMaybeDuration(show.actualDuration)}
              />
            )}
          </dl>
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  planned,
  actual,
  offset,
}: {
  label: string;
  planned: string;
  actual: string;
  offset?: MaybeNumber;
}) {
  return (
    <>
      <dt className={style.metricLabel}>{label}</dt>
      <dd className={style.metricValue}>
        <span className={style.planned}>{planned}</span>
        <span className={style.arrow}>→</span>
        <span className={style.actual}>{actual}</span>
      </dd>
      <dd className={cx([style.metricOffset, offset !== undefined && style[offsetTone(offset)]])}>
        {offset === undefined ? '' : formatOffset(offset)}
      </dd>
    </>
  );
}

function formatMaybeTime(value: MaybeNumber): string {
  return value === null ? enDash : formatTime(value);
}

function formatMaybeDuration(value: MaybeNumber): string {
  return value === null ? enDash : formatDuration(value, false);
}
