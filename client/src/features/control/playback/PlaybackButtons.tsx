import { Playstate } from '../../../common/models/OntimeTypes';

import Playback from './Playback';
import Transport from './Transport';

interface PlaybackButtonsProps {
  playback: Playstate;
  selectedId: string | null;
  noEvents: boolean;
}

export default function PlaybackButtons(props: PlaybackButtonsProps) {
  const { playback, selectedId, noEvents } = props;
  return (
    <>
      <Playback
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
