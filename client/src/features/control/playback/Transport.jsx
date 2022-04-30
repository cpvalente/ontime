import React from 'react';
import { IoPlaySkipBack } from '@react-icons/all-files/io5/IoPlaySkipBack';
import { IoPlaySkipForward } from '@react-icons/all-files/io5/IoPlaySkipForward';
import { IoArrowUndo } from '@react-icons/all-files/io5/IoArrowUndo';
import UnloadIconBtn from '../../../common/components/buttons/UnloadIconBtn';
import PropTypes from 'prop-types';
import style from './PlaybackControl.module.scss';
import TransportIconBtn from '../../../common/components/buttons/TransportIconBtn';

export default function Transport(props) {
  const { playback, selectedId, playbackControl, noEvents } = props;
  const isRolling = playback === 'roll';

  return (
    <div className={style.playbackContainer}>
      <TransportIconBtn
        clickhandler={() => playbackControl('previous')}
        disabled={isRolling || noEvents}
        tooltip='Previous event'
        icon={<IoPlaySkipBack size='22px' />}
      />
      <TransportIconBtn
        clickhandler={() => playbackControl('next')}
        disabled={isRolling || noEvents}
        tooltip='Next event'
        icon={<IoPlaySkipForward size='22px' />}
      />
      <TransportIconBtn
        clickhandler={() => playbackControl('reload')}
        disabled={selectedId == null || isRolling || noEvents}
        tooltip='Reload event'
        icon={<IoArrowUndo size='22px' />}
      />
      <UnloadIconBtn
        clickhandler={() => playbackControl('unload')}
        disabled={(selectedId == null && !isRolling) || noEvents}
      />
    </div>
  );
}

Transport.propTypes = {
  playback: PropTypes.string,
  selectedId: PropTypes.string,
  playbackControl: PropTypes.func.isRequired,
  noEvents: PropTypes.bool.isRequired,
};
