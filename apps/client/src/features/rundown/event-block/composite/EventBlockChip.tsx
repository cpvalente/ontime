import { Tooltip } from '@chakra-ui/react';
import { OntimeEvent, ReportData } from 'ontime-types';
import { isPlaybackActive, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import { usePlayback, useTimeUntil } from '../../../../common/hooks/useSocket';
import useReport from '../../../../common/hooks-query/useReport';
import useRundown from '../../../../common/hooks-query/useRundown';
import { cx } from '../../../../common/utils/styleUtils';
import { formatDuration, getTimeToStart } from '../../../../common/utils/time';
import { tooltipDelayFast } from '../../../../ontimeConfig';

import style from './EventBlockChip.module.scss';

interface EventBlockChipProps {
  id: string;
  timeStart: number;
  isPast: boolean;
  isLoaded: boolean;
  className: string;
}

//TODO: what about gaps and overlaps
export default function EventBlockChip(props: EventBlockChipProps) {
  const { id, timeStart, isPast, isLoaded, className } = props;
  const { playback } = usePlayback();

  if (isLoaded) {
    return null;
  }

  const playbackActive = isPlaybackActive(playback);

  if (!playbackActive || isPast) {
    return <EventReport className={className} id={id} />;
  }

  if (playbackActive) {
    return <EventUntil className={className} timeStart={timeStart} />;
  }

  return null;
}

interface EventReport {
  id: string;
  className: string;
}

function EventReport(props: EventReport) {
  const { id, className } = props;
  const { data } = useReport();
  const {
    data: { rundown },
  } = useRundown();

  const report: ReportData | undefined = data[id];

  if (report && report.startAt !== null && report.endAt !== null) {
    const currentEvent = rundown[id] as OntimeEvent;
    const expectedDuration = currentEvent.duration;
    const actualDuration = report.endAt - report.startAt;
    const overUnder = actualDuration - expectedDuration;
    if (Math.abs(overUnder) > MILLIS_PER_SECOND) {
      const isNegative = overUnder < 0;
      const absOverUnder = Math.abs(overUnder);

      //show seconds if the amount is less than 2 minutes as it could then represent up to 50% of the actual value
      const reportDisplay = `${isNegative ? '-' : '+'}${formatDuration(absOverUnder, absOverUnder > MILLIS_PER_MINUTE * 2)}`;

      return (
        <Tooltip label='Offset from lats run' openDelay={tooltipDelayFast}>
          <div className={cx([style.chip, className, isNegative ? style.under : style.over])}>{reportDisplay}</div>
        </Tooltip>
      );
    }
  }
  return null;
}

interface EventUntilProps {
  className: string;
  timeStart: number;
}

function EventUntil(props: EventUntilProps) {
  const { timeStart, className } = props;
  const { clock, offset } = useTimeUntil();

  if (offset === null) {
    return null; //TODO: this partially fixes the DUE flashing, but instead hides everything
  }

  const timeUntil = getTimeToStart(clock, timeStart, 0, offset);
  const isDue = timeUntil <= MILLIS_PER_SECOND;

  //show seconds if the amount is less than 2 minutes as it could then represent up to 50% of the actual value
  const timeDisplay = isDue ? 'DUE' : `${formatDuration(Math.abs(timeUntil), timeUntil > MILLIS_PER_MINUTE * 2)}`;
  return (
    <Tooltip label='Expected time until start' openDelay={tooltipDelayFast}>
      <div className={cx([style.chip, isDue ? style.due : null, className])}>{timeDisplay}</div>
    </Tooltip>
  );
}
