import { IoPause } from '@react-icons/all-files/io5/IoPause';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoTimeOutline } from '@react-icons/all-files/io5/IoTimeOutline';

import { setPlayback } from '../../../common/hooks/useSocket';
import { Playback } from '../../../common/models/OntimeTypes';

import TapButton from './TapButton';

import style from './PlaybackControl.module.scss';

interface PlaybackProps {
  playback: Playback;
  selectedId: string | null;
  noEvents: boolean;
}

export default function PlaybackDisplay(props: PlaybackProps) {
  const { playback, selectedId, noEvents } = props;
  const isRolling = playback === 'roll';
  const isPlaying = playback === 'play';
  const isPaused = playback === 'pause';
  const isArmed = playback === 'armed';

  console.log('>>>>>>>>>>>>>>>>', selectedId)

  return (
    <div className={style.playbackContainer}>
      <TapButton
        onClick={() => setPlayback.start()}
        disabled={!selectedId || isRolling}
        theme='play'
        active={isPlaying}
      >
        <IoPlay />
      </TapButton>

      <TapButton
        onClick={() => setPlayback.pause()}
        disabled={!selectedId || isRolling || isArmed}
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
