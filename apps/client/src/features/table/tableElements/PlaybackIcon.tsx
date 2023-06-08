import { Tooltip } from '@chakra-ui/react';
import { IoPause } from '@react-icons/all-files/io5/IoPause';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoStop } from '@react-icons/all-files/io5/IoStop';
import { Playback } from 'ontime-types';

import { tooltipDelayFast } from '../../../ontimeConfig';

interface PlaybackIconProps {
  state: Playback;
}

export default function PlaybackIcon(props: PlaybackIconProps) {
  const { state } = props;

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

  return (
    <Tooltip openDelay={tooltipDelayFast} label={label} shouldWrapChildren>
      <Icon />
    </Tooltip>
  );
}
