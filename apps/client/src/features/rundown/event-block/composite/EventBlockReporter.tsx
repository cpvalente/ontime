import { Playback, ReportData } from 'ontime-types';
import { MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import { useReportStatus } from '../../../../common/hooks/useSocket';
import useReport from '../../../../common/hooks-query/useReport';
import { formatDuration } from '../../../../common/utils/time';
import { getTimeToStart } from '../../../../views/timeline/timeline.utils';

import style from './EventBlockReporter.module.scss';

export default function EventBlockReporter(props: { id: string; timeStart: number; isPastOrLoaded: boolean }) {
  const { id, timeStart, isPastOrLoaded } = props;
  const { data } = useReport();
  const { clock, offset, playback } = useReportStatus();

  const report: ReportData | undefined = data[id];

  const showReport =
    (playback !== Playback.Play && playback !== Playback.Roll) || //If we are not playing never show until time
    isPastOrLoaded; //we are playing but is past

  if (report && report.overUnder !== null && showReport) {
    const isNegative = (report?.overUnder ?? 0) < 0;
    const overUnder = Math.abs(report?.overUnder);

    //TODO: show seconds if less the 5 minutes?
    const reportDisplay = `${isNegative ? '-' : ''}${formatDuration(overUnder, overUnder > MILLIS_PER_MINUTE * 5)}`;

    // we show report display if the event is over
    // otherwise we show time until

    if (showReport) {
      return <div className={`${style.chip} ${isNegative ? style.under : style.over}`}>{reportDisplay}</div>;
    }
  }

  if (!showReport) {
    const timeUntil = getTimeToStart(clock, timeStart, 0, offset);
    const isDue = timeUntil <= 0;
    const timeDisplay = isDue ? 'DUE' : `${formatDuration(Math.abs(timeUntil), timeUntil > MILLIS_PER_MINUTE * 5)}`;

    if (id === '71193c') {
      console.log(timeUntil);
      // console.log(formatDuration(timeUntil, false));
    }
    return <div className={`${style.chip} `}>{timeDisplay}</div>;
  }

  return null;
}
