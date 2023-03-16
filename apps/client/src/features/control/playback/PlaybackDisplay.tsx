import { IoPause } from '@react-icons/all-files/io5/IoPause';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoTimeOutline } from '@react-icons/all-files/io5/IoTimeOutline';
import { Playback } from 'ontime-types';

import { setPlayback } from '../../../common/hooks/useSocket';

import TapButton from './TapButton';

import style from './PlaybackControl.module.scss';

interface PlaybackProps {
  playback: Playback;
  noEvents: boolean;
}

export default function PlaybackDisplay(props: PlaybackProps) {
  const { playback, noEvents } = props;
  const isRolling = playback === Playback.Roll;
  const isPlaying = playback === Playback.Play;
  const isPaused = playback === Playback.Pause;
  const isArmed = playback === Playback.Armed;
  const isStopped = playback === Playback.Stop;

  return (
    <div className={style.playbackContainer}>
      <TapButton
        onClick={() => setPlayback.start()}
        disabled={isStopped || isRolling}
        theme={Playback.Play}
        active={isPlaying}
      >
        <IoPlay />
      </TapButton>

      <TapButton
        onClick={() => setPlayback.pause()}
        disabled={isStopped || isRolling || isArmed}
        theme={Playback.Pause}
        active={isPaused}
      >
        <IoPause />
      </TapButton>

      <TapButton
        onClick={() => setPlayback.roll()}
        disabled={!isStopped || noEvents}
        theme={Playback.Roll}
        active={isRolling}
      >
        <IoTimeOutline />
      </TapButton>
    </div>
  );
}
