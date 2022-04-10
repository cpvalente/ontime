import React from 'react';
import PrevIconBtn from '../../../common/components/buttons/PrevIconBtn';
import NextIconBtn from '../../../common/components/buttons/NextIconBtn';
import ReloadIconButton from '../../../common/components/buttons/ReloadIconBtn';
import UnloadIconBtn from '../../../common/components/buttons/UnloadIconBtn';
import PropTypes from 'prop-types';
import style from './PlaybackControl.module.scss';

export default function Transport(props) {
  const { playback, selectedId, playbackControl, noEvents } = props;
  const isRolling = playback === 'roll';

  return (
    <div className={style.playbackContainer}>
      <PrevIconBtn
        clickhandler={() => playbackControl('previous')}
        disabled={isRolling || noEvents}
      />
      <NextIconBtn
        clickhandler={() => playbackControl('next')}
        disabled={isRolling || noEvents}
      />
      <ReloadIconButton
        clickhandler={() => playbackControl('reload')}
        disabled={selectedId == null || isRolling || noEvents}
      />
      <UnloadIconBtn
        clickhandler={() => playbackControl('unload')}
        disabled={(selectedId == null && !isRolling) || noEvents}
      />
    </div>
  );
};

Transport.propTypes = {
  playback: PropTypes.string,
  selectedId: PropTypes.string,
  playbackControl: PropTypes.func.isRequired,
  noEvents: PropTypes.bool.isRequired,
};
