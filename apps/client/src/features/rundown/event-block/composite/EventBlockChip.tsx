import { Tooltip } from '@chakra-ui/react';
import { isPlaybackActive, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import { usePlayback, useTimelineStatus } from '../../../../common/hooks/useSocket';
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
}

export default function EventBlockChip(props: EventBlockChipProps) {
  const { trueTimeStart, isPast, isLoaded, className, totalGap, isLinkedAndNext } = props;
  const { playback } = usePlayback();

  if (isLoaded) {
    return null; //TODO: the is a small flash of 'DUE' on the loaded event as clock data arrives before isLoaded propagates
  }

  const playbackActive = isPlaybackActive(playback);

  if (!playbackActive || isPast) {
    return null; //TODO: Event report will go here
  }

  // we extracted the component to avoid unnecessary calculations and re-renders
  return (
    <Tooltip label='Expected time until start' openDelay={tooltipDelayFast}>
      <div className={className}>
        <EventUntil trueTimeStart={trueTimeStart} totalGap={totalGap} isLinkedAndNext={isLinkedAndNext} />
      </div>
    </Tooltip>
  );
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
