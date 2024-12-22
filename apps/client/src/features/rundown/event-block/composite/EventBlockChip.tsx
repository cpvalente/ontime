import { useMemo } from 'react';
import { Tooltip } from '@chakra-ui/react';
import type { MaybeNumber } from 'ontime-types';
import { dayInMs, isPlaybackActive, MILLIS_PER_SECOND } from 'ontime-utils';

import { usePlayback, useTimelineStatus } from '../../../../common/hooks/useSocket';
import { cx } from '../../../../common/utils/styleUtils';
import { formatDuration } from '../../../../common/utils/time';
import { tooltipDelayFast } from '../../../../ontimeConfig';
import { useTranslation } from '../../../../translation/TranslationProvider';

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
  const { getLocalizedString } = useTranslation();

  const [timeUntilString, isDue] = useMemo(() => {
    const gap = accumulatedGap ?? 0;

    const consumedOffset = isNextAndLinked ? offset : Math.min(offset + gap, 0);
    const offsetTimestart = timeStart - consumedOffset;
    const timeUntil = offsetTimestart - clock;
    const isDue = timeUntil < MILLIS_PER_SECOND;
    return [
      isDue ? getLocalizedString('timeline.due').toUpperCase() : `${formatDuration(Math.abs(timeUntil), false)}`,
      isDue,
    ];
  }, [accumulatedGap, clock, getLocalizedString, isNextAndLinked, offset, timeStart]);

  if (offset === null) {
    return null; //TODO: change offset to a maybe number
  }

  return (
    <Tooltip label='Expected time until start' openDelay={tooltipDelayFast}>
      <div className={cx([style.chip, isDue ? style.due : null, className])}>
        <div>{timeUntilString}</div>
        <div>gap: {formatDuration(accumulatedGap ?? 0, false)}</div>
        {/* <div>o: {formatDuration(Math.abs(offset), false)}</div>
        <div>ref: {formatDuration(refreceStartTime, false)}</div>
        <div>rel: {formatDuration(relativeStartTime, false)}</div> */}
      </div>
    </Tooltip>
  );
}
