import { Playback } from 'ontime-types';

import PlaybackDisplay from './PlaybackDisplay';
import Transport from './Transport';

interface PlaybackButtonsProps {
  playback: Playback;
  selectedId: string | null;
  noEvents: boolean;
}

export default function PlaybackButtons(props: PlaybackButtonsProps) {
  const { playback, selectedId, noEvents } = props;
  return (
    <>
      <PlaybackDisplay
        playback={playback}
        selectedId={selectedId}
        noEvents={noEvents}
      />
      <Transport
        playback={playback}
        selectedId={selectedId}
        noEvents={noEvents}
      />
    </>
  );
};
