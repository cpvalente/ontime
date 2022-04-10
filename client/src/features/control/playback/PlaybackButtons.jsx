import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Transport from './Transport';
import Playback from './Playback';

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.playback === nextProps.playback &&
    prevProps.selectedId === nextProps.selectedId &&
    prevProps.noEvents === nextProps.noEvents
  );
};

const PlaybackButtons = (props) => {
  const { playback, selectedId, noEvents, playbackControl } = props;
  return (
    <>
      <Playback
        playback={playback}
        selectedId={selectedId}
        noEvents={noEvents}
        playbackControl={playbackControl}
      />
      <Transport
        playback={playback}
        selectedId={selectedId}
        noEvents={noEvents}
        playbackControl={playbackControl}
      />
    </>
  );
};

export default memo(PlaybackButtons, areEqual);

PlaybackButtons.propTypes = {
  playback: PropTypes.string,
  selectedId: PropTypes.string,
  playbackControl: PropTypes.func.isRequired,
  noEvents: PropTypes.bool.isRequired,
};
