import React from 'react';
import PropTypes from 'prop-types';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoTimeOutline } from '@react-icons/all-files/io5/IoTimeOutline';
import { IoPause } from '@react-icons/all-files/io5/IoPause';
import { IoStop } from '@react-icons/all-files/io5/IoStop';
import { Tooltip } from '@chakra-ui/tooltip';

export default function PlaybackIcon(props) {
  const { state } = props;

  if (state === 'stop') {
    return (
      <Tooltip openDelay={300} label='Timer Stopped' shouldWrapChildren>
        <IoStop />
      </Tooltip>
    );
  }

  if (state === 'start') {
    return (
      <Tooltip openDelay={300} label='Timer Playing' shouldWrapChildren>
        <IoPlay />
      </Tooltip>
    );
  }

  if (state === 'pause') {
    return (
      <Tooltip openDelay={300} label='Timer Paused' shouldWrapChildren>
        <IoPause />
      </Tooltip>
    );
  }

  if (state === 'roll') {
    return (
      <Tooltip openDelay={300} label='Timer Rolling' shouldWrapChildren>
        <IoTimeOutline />
      </Tooltip>
    );
  }

  return '';
}

PlaybackIcon.propTypes = {
  state: PropTypes.string,
};
