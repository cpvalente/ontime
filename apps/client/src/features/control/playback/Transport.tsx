import { Tooltip } from '@chakra-ui/react';
import { IoPlaySkipBack } from '@react-icons/all-files/io5/IoPlaySkipBack';
import { IoPlaySkipForward } from '@react-icons/all-files/io5/IoPlaySkipForward';
import { IoReload } from '@react-icons/all-files/io5/IoReload';
import { IoStop } from '@react-icons/all-files/io5/IoStop';
import { Playback } from 'ontime-types';

import { setPlayback } from '../../../common/hooks/useSocket';
import { tooltipDelayMid } from '../../../ontimeConfig';

import TapButton from './TapButton';

import style from './PlaybackControl.module.scss';

interface TransportProps {
  playback: Playback;
  selectedId: string | null;
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
          disabled={!selectedId || isRolling}
        >
          <IoReload className={style.invertX} />
        </TapButton>
      </Tooltip>
      <Tooltip label='Unload Event' openDelay={tooltipDelayMid}>
        <TapButton
          onClick={() => setPlayback.stop()}
          disabled={!selectedId && !isRolling}
          theme='stop'
        >
          <IoStop />
        </TapButton>
      </Tooltip>
    </div>
  );
}
