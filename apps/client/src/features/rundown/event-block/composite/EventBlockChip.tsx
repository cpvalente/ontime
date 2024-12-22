import { Tooltip } from '@chakra-ui/react';
import { isPlaybackActive, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import { usePlayback, useTimelineStatus } from '../../../../common/hooks/useSocket';
import { cx } from '../../../../common/utils/styleUtils';
import { formatDuration } from '../../../../common/utils/time';
import { tooltipDelayFast } from '../../../../ontimeConfig';
import { getTimeToStart } from '../../../../views/timeline/timeline.utils';

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
  const { timeStart, isPast, isLoaded, className } = props;
  const { playback } = usePlayback();

  if (isLoaded) {
    return null;
  }

  const playbackActive = isPlaybackActive(playback);

  if (!playbackActive || isPast) {
    return null; //TODO: Event report will go here
  }

  if (playbackActive) {
    return <EventUntil className={className} timeStart={timeStart} />;
  }

  return null;
}

interface EventUntilProps {
  className: string;
  timeStart: number;
}

function EventUntil(props: EventUntilProps) {
  const { timeStart, className } = props;
  const { clock, offset } = useTimelineStatus();

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
