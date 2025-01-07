import { IoPause } from 'react-icons/io5';
import { IoPlay } from 'react-icons/io5';
import { IoStop } from 'react-icons/io5';
import { Playback } from 'ontime-types';

import { tooltipDelayFast } from '../../../ontimeConfig';
import { Tooltip } from '../ui/tooltip';

interface PlaybackIconProps {
  state: Playback;
  skipTooltip?: boolean;
  className?: string;
}

export default function PlaybackIcon(props: PlaybackIconProps) {
  const { state, skipTooltip, className } = props;

  // if timer is Pause or Armed
  let label = 'Timer Paused';
  let Icon = IoPause;

  if (state === Playback.Roll) {
    label = 'Timer Rolling';
    Icon = IoPlay;
  } else if (state === Playback.Play) {
    label = 'Timer Playing';
    Icon = IoPlay;
  } else if (state === Playback.Stop) {
    label = 'Timer Stopped';
    Icon = IoStop;
  }

  if (skipTooltip) {
    return <Icon className={className} />;
  }

  return (
    <Tooltip openDelay={tooltipDelayFast} content={label}>
      <Icon className={className} />
    </Tooltip>
  );
}
