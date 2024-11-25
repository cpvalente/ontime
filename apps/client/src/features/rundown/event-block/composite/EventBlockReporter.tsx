import { Tooltip } from '@chakra-ui/react';
import { useDebouncedValue } from '@mantine/hooks';
import { Playback, ReportData } from 'ontime-types';
import { MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import { useReportStatus } from '../../../../common/hooks/useSocket';
import useReport from '../../../../common/hooks-query/useReport';
import { formatDuration } from '../../../../common/utils/time';
import { tooltipDelayFast } from '../../../../ontimeConfig';
import { getTimeToStart } from '../../../../views/timeline/timeline.utils';

import style from './EventBlockReporter.module.scss';

type EventBlockReporterProps = { id: string; timeStart: number; isPastOrLoaded: boolean };

export default function EventBlockReporter(props: EventBlockReporterProps) {
  const { id, timeStart, isPastOrLoaded } = props;
  const { data } = useReport();
  const status = useReportStatus();
  const [debouncedStatus] = useDebouncedValue(status, 200);
  const { clock, offset, playback } = debouncedStatus;
  const report: ReportData | undefined = data[id];

  const showReport =
    (playback !== Playback.Play && playback !== Playback.Roll) || //If we are not playing never show until time
    isPastOrLoaded; //we are playing but is past

  if (report && report.overUnder !== null && showReport) {
    const isNegative = (report?.overUnder ?? 0) < 0;
    const overUnder = Math.abs(report?.overUnder);

    //TODO: show seconds if less the 5 minutes?
    const reportDisplay = `${isNegative ? '-' : ''}${formatDuration(overUnder, overUnder > MILLIS_PER_MINUTE * 5)}`;

    return (
      <Tooltip label='Offset from lats run' openDelay={tooltipDelayFast}>
        <div className={`${style.chip} ${isNegative ? style.under : style.over}`}>{reportDisplay}</div>
      </Tooltip>
    );
  }

  if (!showReport) {
    const timeUntil = getTimeToStart(clock, timeStart, 0, offset);
    const isDue = timeUntil <= MILLIS_PER_SECOND;
    const timeDisplay = isDue ? 'DUE' : `${formatDuration(Math.abs(timeUntil), timeUntil > MILLIS_PER_MINUTE * 5)}`;

    return (
      <Tooltip label='Expected time until start' openDelay={tooltipDelayFast}>
        <div className={`${style.chip} `}>{timeDisplay}</div>
      </Tooltip>
    );
  }

  return null;
}
