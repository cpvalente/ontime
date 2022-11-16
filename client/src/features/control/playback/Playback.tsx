import { Tooltip } from '@chakra-ui/react';
import { IoPause } from '@react-icons/all-files/io5/IoPause';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoTimeOutline } from '@react-icons/all-files/io5/IoTimeOutline';

import { setPlayback } from '../../../common/hooks/useSocket';
import { Playstate } from '../../../common/models/OntimeTypes';
import { tooltipDelayMid } from '../../../ontimeConfig';

import TapButton from './TapButton';

import style from './PlaybackControl.module.scss';

interface PlaybackProps {
  playback: Playstate;
  selectedId: string;
  noEvents: boolean;
}

export default function Playback(props: PlaybackProps) {
  const { playback, selectedId, noEvents } = props;
  const isRolling = playback === 'roll';

  return (
    <div className={style.playbackContainer}>
      <Tooltip label='Start playback' openDelay={100}>
        <TapButton
          onClick={() => setPlayback.start()}
          disabled={!selectedId || isRolling || noEvents}
          theme='start'
          active={playback === 'start'}
        >
          <IoPlay />
        </TapButton>
      </Tooltip>

      <Tooltip label='Pause playback' openDelay={tooltipDelayMid}>
        <TapButton
          onClick={() => setPlayback.pause()}
          disabled={!selectedId || isRolling || noEvents || playback !== 'start'}
          theme='pause'
          active={playback === 'pause'}
        >
          <IoPause />
        </TapButton>
      </Tooltip>

      <Tooltip label='Start roll mode' openDelay={tooltipDelayMid}>
        <TapButton
          onClick={() => setPlayback.roll()}
          disabled={playback === 'roll' || noEvents}
          theme='roll'
          active={isRolling}
        >
          <IoTimeOutline />
        </TapButton>
      </Tooltip>
    </div>
  );
}
