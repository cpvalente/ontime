import { Playback } from 'ontime-types';

import PlaybackDisplay from './PlaybackDisplay';
import Transport from './Transport';

interface PlaybackButtonsProps {
  playback: Playback;
  noEvents: boolean;
}

export default function PlaybackButtons(props: PlaybackButtonsProps) {
  const { playback, noEvents } = props;
  return (
    <>
      <PlaybackDisplay playback={playback} noEvents={noEvents} />
      <Transport playback={playback} noEvents={noEvents} />
    </>
  );
};
