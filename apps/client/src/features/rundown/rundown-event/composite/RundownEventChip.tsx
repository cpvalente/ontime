import { useMemo } from 'react';
import { IoCheckmarkCircle } from 'react-icons/io5';
import { isPlaybackActive, MILLIS_PER_MINUTE, MILLIS_PER_SECOND, millisToString } from 'ontime-utils';

import Tooltip from '../../../../common/components/tooltip/Tooltip';
import { usePlayback } from '../../../../common/hooks/useSocket';
import useReport from '../../../../common/hooks-query/useReport';
import { cx } from '../../../../common/utils/styleUtils';
import { formatDuration, useTimeUntilExpectedStart } from '../../../../common/utils/time';

import style from './RundownEventChip.module.scss';

interface RundownEventChipProps {
  id: string;
  timeStart: number;
  delay: number;
  dayOffset: number;
  isPast: boolean;
  isLoaded: boolean;
  className: string;
  totalGap: number;
  duration: number;
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
  duration,
  isLinkedToLoaded,
}: RundownEventChipProps) {
  const playback = usePlayback();

  if (isLoaded) {
    return null;
  }

  const playbackActive = isPlaybackActive(playback);

  if (!playbackActive || isPast) {
    return <EventReport className={className} id={id} duration={duration} />;
  }

  if (playbackActive) {
    // we extracted the component to avoid unnecessary calculations and re-renders
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

  return null;
}

interface EventUntilProps {
  timeStart: number;
  delay: number;
  dayOffset: number;
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
  duration: number;
}

function EventReport(props: EventReportProps) {
  const { className, id, duration } = props;
  const { data } = useReport();
  const currentReport = data[id];

  const [value, overUnderStyle, tooltip] = useMemo(() => {
    if (!currentReport) {
      return [null, 'none', ''];
    }

    const { startedAt, endedAt } = currentReport;
    if (!startedAt || !endedAt) {
      return [null, 'none', ''];
    }

    const actualDuration = endedAt - startedAt;
    const difference = actualDuration - duration;
    const absDifference = Math.abs(difference);

    if (absDifference < MILLIS_PER_SECOND) {
      return ['ontime', 'under', 'Event finished on time'];
    }

    const isOver = difference > 0;

    const fullTimeValue = millisToString(absDifference);

    const tooltip = `Event ran ${isOver ? 'over' : 'under'} time by ${fullTimeValue}`;

    const value = `${isOver ? '+' : '-'}${formatDuration(absDifference, absDifference > 2 * MILLIS_PER_MINUTE)}`;
    return [value, isOver ? 'over' : 'under', tooltip];
  }, [currentReport, duration]);

  if (!value) {
    return null;
  }

  return (
    <Tooltip text={tooltip} render={<span />} className={cx([style.chip, style[overUnderStyle], className])}>
      {value === 'ontime' ? <IoCheckmarkCircle size='1.1rem' /> : value}
    </Tooltip>
  );
}
