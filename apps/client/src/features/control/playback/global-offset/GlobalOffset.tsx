import { Tooltip } from '@chakra-ui/react';
import { Playback } from 'ontime-types';
import { MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import { setPlayback, usePlaybackControl } from '../../../../common/hooks/useSocket';
import { tooltipDelayMid } from '../../../../ontimeConfig';
import TapButton from '../tap-button/TapButton';

import style from './GlobalOffset.module.scss';

export default function GlobalOffset() {
  const { playback } = usePlaybackControl();
  const canAddTime = playback === Playback.Play || playback === Playback.Pause;

  return (
    <div className={style.globalOffset}>
      <div className={style.label}>Global Offset</div>
      <div className={style.globalButtons}>
        <Tooltip label='Global delay -1:00' openDelay={tooltipDelayMid} shouldWrapChildren>
          <TapButton
            onClick={() => setPlayback.addGlobalDelay((-1 * MILLIS_PER_MINUTE) / MILLIS_PER_SECOND)}
            disabled={!canAddTime}
            className={style.tallButtons}
            theme='neutral'
          >
            -1m
          </TapButton>
        </Tooltip>
        <Tooltip label='Reset global delay' openDelay={tooltipDelayMid} shouldWrapChildren>
          <TapButton
            onClick={setPlayback.resetGlobalDelay}
            disabled={!canAddTime}
            className={style.resetButton}
            theme='neutral'
          >
            Reset
          </TapButton>
        </Tooltip>
        <Tooltip label='Global delay +1:00' openDelay={tooltipDelayMid} shouldWrapChildren>
          <TapButton
            onClick={() => setPlayback.addGlobalDelay(MILLIS_PER_MINUTE / MILLIS_PER_SECOND)}
            disabled={!canAddTime}
            className={style.tallButtons}
            theme='neutral'
          >
            +1m
          </TapButton>
        </Tooltip>
      </div>
    </div>
  );
}
