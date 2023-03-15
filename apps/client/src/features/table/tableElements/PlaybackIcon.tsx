import { Tooltip } from '@chakra-ui/react';
import { IoPause } from '@react-icons/all-files/io5/IoPause';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoStop } from '@react-icons/all-files/io5/IoStop';
import { IoTimeOutline } from '@react-icons/all-files/io5/IoTimeOutline';
import { Playback } from 'ontime-types';

import { tooltipDelayFast } from '../../../ontimeConfig';

interface PlaybackIconProps {
  state: Playback;
}

export default function PlaybackIcon(props: PlaybackIconProps) {
  const { state } = props;

  if (state === Playback.Stop) {
    return (
      <Tooltip openDelay={tooltipDelayFast} label='Timer Stopped' shouldWrapChildren>
        <IoStop />
      </Tooltip>
    );
  }

  if (state === Playback.Play) {
    return (
      <Tooltip openDelay={tooltipDelayFast} label='Timer Playing' shouldWrapChildren>
        <IoPlay />
      </Tooltip>
    );
  }

  if (state === Playback.Pause) {
    return (
      <Tooltip openDelay={tooltipDelayFast} label='Timer Paused' shouldWrapChildren>
        <IoPause />
      </Tooltip>
    );
  }

  if (state === Playback.Roll) {
    return (
      <Tooltip openDelay={tooltipDelayFast} label='Timer Rolling' shouldWrapChildren>
        <IoTimeOutline />
      </Tooltip>
    );
  }

  return '';
}
