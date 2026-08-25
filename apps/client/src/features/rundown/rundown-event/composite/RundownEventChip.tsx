import { Day } from 'ontime-types';
import { MILLIS_PER_MINUTE, MILLIS_PER_SECOND, isPlaybackActive, millisToString } from 'ontime-utils';
import { useMemo } from 'react';
import { IoCheckmarkCircle } from 'react-icons/io5';

import Tooltip from '../../../../common/components/tooltip/Tooltip';
import useReport from '../../../../common/hooks-query/useReport';
import { usePlayback } from '../../../../common/hooks/useSocket';
import { getEventVariance } from '../../../../common/utils/report';
import { cx } from '../../../../common/utils/styleUtils';
import { formatDuration, useTimeUntilExpectedStart } from '../../../../common/utils/time';

import style from './RundownEventChip.module.scss';

interface RundownEventChipProps {
  id: string;
  timeStart: number;
  delay: number;
  dayOffset: Day;
  isPast: boolean;
  isLoaded: boolean;
  className: string;
  totalGap: number;
  isLinkedToLoaded: boolean;
}

export default function RundownEventChip({
  timeStart,
  delay,
  dayOffset,
  isPast,
  isLoaded,
  className,
  totalGap,
  id,
  isLinkedToLoaded,
}: RundownEventChipProps) {
  const playback = usePlayback();

  if (isLoaded) {
    return null;
  }

  const playbackActive = isPlaybackActive(playback);

  if (!playbackActive || isPast) {
    return <EventReport className={className} id={id} />;
  }

  return (
    <Tooltip text='Expected time until start' render={<span />} className={className}>
      <EventUntil
        timeStart={timeStart}
        delay={delay}
        dayOffset={dayOffset}
        totalGap={totalGap}
        isLinkedToLoaded={isLinkedToLoaded}
      />
    </Tooltip>
  );
}

interface EventUntilProps {
  timeStart: number;
  delay: number;
  dayOffset: Day;
  totalGap: number;
  isLinkedToLoaded: boolean;
}

function EventUntil({ timeStart, delay, dayOffset, totalGap, isLinkedToLoaded }: EventUntilProps) {
  const timeUntil = useTimeUntilExpectedStart({ timeStart, delay, dayOffset }, { totalGap, isLinkedToLoaded });
  const isDue = timeUntil < MILLIS_PER_SECOND;

  const timeUntilString = isDue ? 'DUE' : `${formatDuration(Math.abs(timeUntil), timeUntil > 2 * MILLIS_PER_MINUTE)}`;

  return <div className={cx([style.chip, isDue && style.due])}>{timeUntilString}</div>;
}

interface EventReportProps {
  className: string;
  id: string;
}

function EventReport({ className, id }: EventReportProps) {
  const { data } = useReport();
  const currentReport = data[id];

  const [value, overUnderStyle, tooltip] = useMemo(() => {
    // Use the schedule recorded when the event ran so later rundown edits do
    // not change its report.
    const variance = getEventVariance(currentReport);
    if (variance.status === 'not-run') {
      return [null, 'none', ''];
    }

    if (variance.status === 'ontime') {
      return ['ontime', 'under', 'Event finished on time'];
    }

    const absDifference = Math.abs(variance.delta);
    const isOver = variance.status === 'over';
    const tooltip = `Event ran ${isOver ? 'over' : 'under'} time by ${millisToString(absDifference)}`;
    const value = `${isOver ? '+' : '-'}${formatDuration(absDifference, absDifference > 2 * MILLIS_PER_MINUTE)}`;
    return [value, variance.status, tooltip];
  }, [currentReport]);

  if (!value) {
    return null;
  }

  return (
    <Tooltip text={tooltip} render={<span />} className={cx([style.chip, style[overUnderStyle], className])}>
      {value === 'ontime' ? <IoCheckmarkCircle size='1.1rem' /> : value}
    </Tooltip>
  );
}
