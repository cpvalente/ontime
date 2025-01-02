import { useMemo } from 'react';
import { Tooltip } from '@chakra-ui/react';
import type { MaybeNumber } from 'ontime-types';
import { dayInMs, isPlaybackActive, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import { usePlayback, useTimelineStatus } from '../../../../common/hooks/useSocket';
import { cx } from '../../../../common/utils/styleUtils';
import { formatDuration } from '../../../../common/utils/time';
import { tooltipDelayFast } from '../../../../ontimeConfig';

import style from './EventBlockChip.module.scss';

interface EventBlockChipProps {
  id: string;
  timeStart: number;
  isPast: boolean;
  isLoaded: boolean;
  className: string;
  accumulatedGap: MaybeNumber;
  isNext: boolean;
  isLinked: boolean;
  isNextDay: boolean;
}

export default function EventBlockChip(props: EventBlockChipProps) {
  const { timeStart, isPast, isLoaded, className, accumulatedGap, isNext, isLinked, isNextDay } = props;
  const { playback } = usePlayback();

  if (isLoaded) {
    return null;
  }

  const playbackActive = isPlaybackActive(playback);

  if (!playbackActive || isPast) {
    return null; //TODO: Event report will go here
  }

  if (playbackActive) {
    // we extracted the component to avoid unnecessary calculations and re-renders
    return (
      <EventUntil
        className={className}
        timeStart={timeStart + (isNextDay ? dayInMs : 0)}
        accumulatedGap={accumulatedGap}
        isNextAndLinked={isNext && isLinked}
      />
    );
  }

  return null;
}

interface EventUntilProps {
  className: string;
  timeStart: number;
  accumulatedGap: MaybeNumber;
  isNextAndLinked: boolean;
}

function EventUntil(props: EventUntilProps) {
  const { timeStart, className, accumulatedGap, isNextAndLinked } = props;
  const { clock, offset } = useTimelineStatus();

  const [timeUntilString, isDue] = useMemo(() => {
    const gap = accumulatedGap ?? 0;

    const consumedOffset = isNextAndLinked ? offset : Math.min(offset + gap, 0);
    const offsetTimestart = timeStart - consumedOffset;
    const timeUntil = offsetTimestart - clock;
    const isDue = timeUntil < MILLIS_PER_SECOND;
    return [isDue ? 'DUE' : `${formatDuration(Math.abs(timeUntil), timeUntil > 2 * MILLIS_PER_MINUTE)}`, isDue];
  }, [accumulatedGap, clock, isNextAndLinked, offset, timeStart]);

  return (
    <Tooltip label='Expected time until start' openDelay={tooltipDelayFast}>
      <div className={cx([style.chip, isDue ? style.due : null, className])}>
        <div>{timeUntilString}</div>
      </div>
    </Tooltip>
  );
}
