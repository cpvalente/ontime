import React from 'react';
import PropTypes from 'prop-types';

import PauseIconBtn from '../../../common/components/buttons/PauseIconBtn';
import RollIconBtn from '../../../common/components/buttons/RollIconBtn';
import StartIconBtn from '../../../common/components/buttons/StartIconBtn';

import style from './PlaybackControl.module.scss';

export default function Playback(props) {
  const { playback, selectedId, playbackControl, noEvents } = props;
  const isRolling = playback === 'roll';

  return (
    <div className={style.playbackContainer}>
      <StartIconBtn
        active={playback === 'start'}
        clickhandler={() => playbackControl('start')}
        disabled={!selectedId || isRolling || noEvents}
      />
      <PauseIconBtn
        active={playback === 'pause'}
        clickhandler={() => playbackControl('pause')}
        disabled={!selectedId || isRolling || noEvents || playback !== 'start'}
      />
      <RollIconBtn
        active={playback === 'roll'}
        disabled={playback === 'roll' || noEvents}
        clickhandler={() => playbackControl('roll')}
      />
    </div>
  );
}

Playback.propTypes = {
  playback: PropTypes.string,
  selectedId: PropTypes.string,
  playbackControl: PropTypes.func.isRequired,
  noEvents: PropTypes.bool.isRequired,
};
