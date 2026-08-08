import { Day } from 'ontime-types';
import {
  EventVariance,
  MILLIS_PER_MINUTE,
  MILLIS_PER_SECOND,
  getEventVariance,
  isPlaybackActive,
  millisToString,
} from 'ontime-utils';
import { useMemo } from 'react';
import { IoCheckmarkCircle } from 'react-icons/io5';

import Tooltip from '../../../../common/components/tooltip/Tooltip';
import { useLoadedRundownId } from '../../../../common/hooks-query/useProjectRundowns';
import useReport from '../../../../common/hooks-query/useReport';
import { useLatestRun } from '../../../../common/hooks-query/useRuns';
import { usePlayback } from '../../../../common/hooks/useSocket';
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

function EventReport(props: EventReportProps) {
  const { className, id } = props;
  const { data } = useReport();
  const currentReport = data[id];

  // an event with nothing in the current run's report yet can still show how
  // it went last time, so a repeat show previews its schedule before it plays
  const loadedRundownId = useLoadedRundownId();
  const { data: lastRun } = useLatestRun(loadedRundownId ?? undefined);

  const [value, chipStyle, tooltip] = useMemo(() => {
    // compares against the schedule as it was when the event ran, not the
    // rundown's current values, so an edit made afterwards cannot change this
    const variance = getEventVariance(currentReport);
    if (variance.status !== 'not-run') {
      return describeVariance(variance, false);
    }

    const lastRunVariance = getEventVariance(lastRun?.report[id]);
    if (lastRunVariance.status !== 'not-run') {
      return describeVariance(lastRunVariance, true);
    }

    return [null, 'none', ''];
  }, [currentReport, id, lastRun]);

  if (!value) {
    return null;
  }

  return (
    <Tooltip text={tooltip} render={<span />} className={cx([style.chip, style[chipStyle], className])}>
      {value === 'ontime' ? <IoCheckmarkCircle size='1.1rem' /> : value}
    </Tooltip>
  );
}

/**
 * Formats a variance into the chip's value, style and tooltip.
 * `muted` marks a preview of a past run rather than a live status.
 */
function describeVariance(variance: EventVariance, muted: boolean): [string, string, string] {
  const prefix = muted ? 'Last run: ' : '';

  if (variance.status === 'ontime') {
    return ['ontime', muted ? 'muted' : 'under', `${prefix}Event finished on time`];
  }

  const absDifference = Math.abs(variance.delta);
  const isOver = variance.status === 'over';
  const fullTimeValue = millisToString(absDifference);
  const tooltip = `${prefix}Event ran ${isOver ? 'over' : 'under'} time by ${fullTimeValue}`;
  const value = `${isOver ? '+' : '-'}${formatDuration(absDifference, absDifference > 2 * MILLIS_PER_MINUTE)}`;
  return [value, muted ? 'muted' : isOver ? 'over' : 'under', tooltip];
}
