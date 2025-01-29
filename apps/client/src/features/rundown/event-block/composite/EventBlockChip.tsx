import { Tooltip } from '@chakra-ui/react';
import type { OntimeEventReport } from 'ontime-types';
import { isPlaybackActive, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import { usePlayback, useTimelineStatus } from '../../../../common/hooks/useSocket';
import useReport from '../../../../common/hooks-query/useReport';
import { cx } from '../../../../common/utils/styleUtils';
import { formatDuration } from '../../../../common/utils/time';
import { tooltipDelayFast } from '../../../../ontimeConfig';

import style from './EventBlockChip.module.scss';

interface EventBlockChipProps {
  id: string;
  trueTimeStart: number;
  isPast: boolean;
  isLoaded: boolean;
  className: string;
  totalGap: number;
  isLinkedAndNext: boolean;
  duration: number;
}

export default function EventBlockChip(props: EventBlockChipProps) {
  const { trueTimeStart, isPast, isLoaded, className, totalGap, isLinkedAndNext, id, duration } = props;
  const { playback } = usePlayback();

  if (isLoaded) {
    return null; //TODO: the is a small flash of 'DUE' on the loaded event as clock data arrives before isLoaded propagates
  }

  const playbackActive = isPlaybackActive(playback);

  if (!playbackActive || isPast) {
    return <EventReport className={className} id={id} duration={duration} />;
  }

  if (playbackActive) {
    // we extracted the component to avoid unnecessary calculations and re-renders
    return (
      <Tooltip label='Expected time until start' openDelay={tooltipDelayFast}>
        <div className={className}>
          <EventUntil trueTimeStart={trueTimeStart} totalGap={totalGap} isLinkedAndNext={isLinkedAndNext} />
        </div>
      </Tooltip>
    );
  }

  return null;
}

interface EventUntilProps {
  trueTimeStart: number;
  totalGap: number;
  isLinkedAndNext: boolean;
}

function EventUntil(props: EventUntilProps) {
  const { trueTimeStart, totalGap, isLinkedAndNext } = props;
  const { clock, offset } = useTimelineStatus();

  const consumedOffset = isLinkedAndNext ? offset : Math.min(offset + totalGap, 0);
  const offsetTimestart = trueTimeStart - consumedOffset;
  const timeUntil = offsetTimestart - clock;
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
  const currentReport: OntimeEventReport | undefined = data[id];

  const [value, isOver] = useMemo(() => {
    if (!currentReport) {
      return [null, false];
    }

    const { startedAt, endedAt } = currentReport;
    if (!startedAt || !endedAt) {
      return [null, false];
    }

    const actualDuration = endedAt - startedAt;
    const difference = actualDuration - duration;
    const absDifference = Math.abs(difference);

    if (absDifference < MILLIS_PER_SECOND) {
      return ['==', false]; //TODO: how to symbolize ontime?
    }

    const isOver = difference > 0;

    const value = `${isOver ? '+' : '-'}${formatDuration(Math.abs(difference), difference > 2 * MILLIS_PER_MINUTE)}`;
    return [value, isOver];
  }, [currentReport, duration]);

  if (!value) {
    return null;
  }

  return (
    <Tooltip label='Difference from the expected duration' openDelay={tooltipDelayFast}>
      <div className={cx([style.chip, isOver ? style.over : style.under, className])}>
        <div>{value}</div>
      </div>
    </Tooltip>
  );
}
