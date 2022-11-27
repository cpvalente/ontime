import { IoPause } from '@react-icons/all-files/io5/IoPause';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoTimeOutline } from '@react-icons/all-files/io5/IoTimeOutline';

import { setPlayback } from '../../../common/hooks/useSocket';
import { Playstate } from '../../../common/models/OntimeTypes';

import TapButton from './TapButton';

import style from './PlaybackControl.module.scss';

interface PlaybackProps {
  playback: Playstate;
  selectedId: string | null;
  noEvents: boolean;
}

export default function Playback(props: PlaybackProps) {
  const { playback, selectedId, noEvents } = props;
  const isRolling = playback === 'roll';
  const isPlaying = playback === 'start';
  const isPaused = playback === 'pause';

  return (
    <div className={style.playbackContainer}>
      <TapButton
        onClick={() => setPlayback.start()}
        disabled={!selectedId || isRolling || noEvents}
        theme='start'
        active={isPlaying}
      >
        <IoPlay />
      </TapButton>

      <TapButton
        onClick={() => setPlayback.pause()}
        disabled={!selectedId || isRolling || noEvents}
        theme='pause'
        active={isPaused}
      >
        <IoPause />
      </TapButton>

      <TapButton
        onClick={() => setPlayback.roll()}
        disabled={noEvents}
        theme='roll'
        active={isRolling}
      >
        <IoTimeOutline />
      </TapButton>
    </div>
  );
}
