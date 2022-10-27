import { Tooltip } from '@chakra-ui/react';
import { IoPlayBack } from '@react-icons/all-files/io5/IoPlayBack';
import { IoPlaySkipBack } from '@react-icons/all-files/io5/IoPlaySkipBack';
import { IoPlaySkipForward } from '@react-icons/all-files/io5/IoPlaySkipForward';
import { IoStop } from '@react-icons/all-files/io5/IoStop';

import { setPlayback } from '../../../common/hooks/useSocket';
import { Playstate } from '../../../common/models/OntimeTypes';
import { tooltipDelayMid } from '../../../ontimeConfig';

import TapButton from './TapButton';

import style from './PlaybackControl.module.scss';

interface TransportProps {
  playback: Playstate;
  selectedId: string;
  noEvents: boolean;
}

export default function Transport(props: TransportProps) {
  const { playback, selectedId, noEvents } = props;

  const isRolling = playback === 'roll';

  return (
    <div className={style.playbackContainer}>
      <Tooltip label='Previous event' openDelay={tooltipDelayMid}>
        <TapButton
          onClick={() => setPlayback.previous()}
          disabled={isRolling || noEvents}
        >
          <IoPlaySkipBack />
        </TapButton>
      </Tooltip>
      <Tooltip label='Next event' openDelay={tooltipDelayMid}>
        <TapButton
          onClick={() => setPlayback.next()}
          disabled={isRolling || noEvents}
        >
          <IoPlaySkipForward />
        </TapButton>
      </Tooltip>
      <Tooltip label='Reload event' openDelay={tooltipDelayMid}>
        <TapButton
          onClick={() => setPlayback.reload()}
          disabled={selectedId == null || isRolling || noEvents}
        >
          <IoPlayBack />
        </TapButton>
      </Tooltip>
      <Tooltip label='Unload Event' openDelay={100}>
        <TapButton
          onClick={() => setPlayback.stop()}
          disabled={(selectedId == null && !isRolling) || noEvents}
          theme='stop'
        >
          <IoStop />
        </TapButton>
      </Tooltip>
    </div>
  );
}
