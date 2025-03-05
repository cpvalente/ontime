import { useMemo } from 'react';
import { Tooltip } from '@chakra-ui/react';
import { IoCheckmarkCircle } from '@react-icons/all-files/io5/IoCheckmarkCircle';
import { isPlaybackActive, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import { usePlayback } from '../../../../common/hooks/useSocket';
import useReport from '../../../../common/hooks-query/useReport';
import { cx } from '../../../../common/utils/styleUtils';
import { formatDuration, formatTime, useTimeUntilStart } from '../../../../common/utils/time';
import { tooltipDelayFast } from '../../../../ontimeConfig';
import { useTranslation } from '../../../../translation/TranslationProvider';

import style from './EventBlockChip.module.scss';

interface EventBlockChipProps {
  id: string;
  normalisedTimeStart: number;
  isPast: boolean;
  isLoaded: boolean;
  className: string;
  totalGap: number;
  duration: number;
  linkedToLoaded: boolean;
}

export default function EventBlockChip(props: EventBlockChipProps) {
  const { normalisedTimeStart, isPast, isLoaded, className, totalGap, id, duration, linkedToLoaded } = props;
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
          <EventUntil normalisedTimeStart={normalisedTimeStart} totalGap={totalGap} linkedToLoaded={linkedToLoaded} />
        </div>
      </Tooltip>
    );
  }

  return null;
}

interface EventUntilProps {
  normalisedTimeStart: number;
  totalGap: number;
  linkedToLoaded: boolean;
}

function EventUntil(props: EventUntilProps) {
  const { normalisedTimeStart, totalGap, linkedToLoaded } = props;
  const { getLocalizedString } = useTranslation();

  const timeUntil = useTimeUntilStart(normalisedTimeStart, totalGap, linkedToLoaded);
  const isDue = timeUntil < MILLIS_PER_SECOND;

  const timeUntilString = isDue
    ? getLocalizedString('timeline.due').toUpperCase()
    : `${formatDuration(Math.abs(timeUntil), timeUntil > 2 * MILLIS_PER_MINUTE)}`;

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
      return ['ontime', 'ontime', 'Event finished ontime'];
    }

    const isOver = difference > 0;

    const fullTimeValue = formatTime(absDifference);

    const tooltip = `Event ran ${isOver ? 'over' : 'under'} time by ${fullTimeValue}`;

    const value = `${isOver ? '+' : '-'}${formatDuration(absDifference, absDifference > 2 * MILLIS_PER_MINUTE)}`;
    return [value, isOver ? 'over' : 'under', tooltip];
  }, [currentReport, duration]);

  if (!value) {
    return null;
  }

  return (
    <Tooltip label={tooltip} openDelay={tooltipDelayFast}>
      <div className={cx([style.chip, style[overUnderStyle], className])}>
        {value === 'ontime' ? <IoCheckmarkCircle size='1.1rem' /> : value}
      </div>
    </Tooltip>
  );
}
