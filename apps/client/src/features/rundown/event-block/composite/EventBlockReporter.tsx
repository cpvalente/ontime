import { Tooltip } from '@chakra-ui/react';
import { ReportData } from 'ontime-types';
import { isPlaybackActive, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import { useReportStatus } from '../../../../common/hooks/useSocket';
import useReport from '../../../../common/hooks-query/useReport';
import { cx } from '../../../../common/utils/styleUtils';
import { formatDuration } from '../../../../common/utils/time';
import { tooltipDelayFast } from '../../../../ontimeConfig';
import { getTimeToStart } from '../../../../views/timeline/timeline.utils';

import style from './EventBlockReporter.module.scss';

interface EventBlockReporterProps {
  id: string;
  timeStart: number;
  isPastOrLoaded: boolean;
  className: string;
}

//TODO: what about gaps and overlaps
export default function EventBlockReporter(props: EventBlockReporterProps) {
  const { id, timeStart, isPastOrLoaded, className } = props;
  const { data } = useReport();
  const { clock, offset, playback } = useReportStatus();
  const report: ReportData | undefined = data[id];

  const showReport =
    isPastOrLoaded || //we are playing but is past
    !isPlaybackActive(playback); //If we are not playing never show until time

  if (report && showReport && report.overUnder !== null && Math.abs(report.overUnder) > MILLIS_PER_SECOND) {
    const isNegative = (report?.overUnder ?? 0) < 0;
    const overUnder = Math.abs(report?.overUnder);

    //show seconds if the amount is less than 2 minutes as it could then represent up to 50% of the actual value?
    const reportDisplay = `${isNegative ? '-' : ''}${formatDuration(overUnder, overUnder > MILLIS_PER_MINUTE * 2)}`;

    return (
      <Tooltip label='Offset from lats run' openDelay={tooltipDelayFast}>
        <div className={cx([style.chip, className, isNegative ? style.under : style.over])}>{reportDisplay}</div>
      </Tooltip>
    );
  }

  if (!showReport) {
    const timeUntil = getTimeToStart(clock, timeStart, 0, offset);
    const isDue = timeUntil <= MILLIS_PER_SECOND;
    const timeDisplay = isDue ? 'DUE' : `${formatDuration(Math.abs(timeUntil), timeUntil > MILLIS_PER_MINUTE * 2)}`;

    return (
      <Tooltip label='Expected time until start' openDelay={tooltipDelayFast}>
        <div className={cx([style.chip, className])}>{timeDisplay}</div>
      </Tooltip>
    );
  }

  return null;
}
