import React from 'react';
import { IoArrowUndo } from '@react-icons/all-files/io5/IoArrowUndo';
import { IoPlaySkipBack } from '@react-icons/all-files/io5/IoPlaySkipBack';
import { IoPlaySkipForward } from '@react-icons/all-files/io5/IoPlaySkipForward';
import PropTypes from 'prop-types';

import TransportIconBtn from '../../../common/components/buttons/TransportIconBtn';
import UnloadIconBtn from '../../../common/components/buttons/UnloadIconBtn';

import style from './PlaybackControl.module.scss';

export default function Transport(props) {
  const { playback, selectedId, playbackControl, noEvents } = props;
  const isRolling = playback === 'roll';

  return (
    <div className={style.playbackContainer}>
      <TransportIconBtn
        clickHandler={() => playbackControl('previous')}
        disabled={isRolling || noEvents}
        tooltip='Previous event'
        icon={<IoPlaySkipBack size='22px' />}
      />
      <TransportIconBtn
        clickHandler={() => playbackControl('next')}
        disabled={isRolling || noEvents}
        tooltip='Next event'
        icon={<IoPlaySkipForward size='22px' />}
      />
      <TransportIconBtn
        clickHandler={() => playbackControl('reload')}
        disabled={selectedId == null || isRolling || noEvents}
        tooltip='Reload event'
        icon={<IoArrowUndo size='22px' />}
      />
      <UnloadIconBtn
        clickHandler={() => playbackControl('unload')}
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
