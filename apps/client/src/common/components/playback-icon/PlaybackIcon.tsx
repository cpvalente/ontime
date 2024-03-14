import { IoPause } from '@react-icons/all-files/io5/IoPause';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoStop } from '@react-icons/all-files/io5/IoStop';
import { Playback } from 'ontime-types';

interface PlaybackIconProps {
  state: Playback;
  skipTooltip?: boolean;
  className?: string;
}

export default function PlaybackIcon(props: PlaybackIconProps) {
  const { state, skipTooltip, className } = props;

  // if timer is Pause or Armed
  let Icon = IoPause;

  if (state === Playback.Roll) {
    Icon = IoPlay;
  } else if (state === Playback.Play) {
    Icon = IoPlay;
  } else if (state === Playback.Stop) {
    Icon = IoStop;
  }

  if (skipTooltip) {
    return <Icon className={className} />;
  }

  return <Icon className={className} />;
}
