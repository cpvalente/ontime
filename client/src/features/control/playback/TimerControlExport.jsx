import React from 'react';
import { Box } from '@chakra-ui/layout';
import { FiArrowUpRight } from '@react-icons/all-files/fi/FiArrowUpRight';

import ErrorBoundary from '../../../common/components/errorBoundary/ErrorBoundary';
import { handleLinks } from '../../../common/utils/linkUtils';

import PlaybackControl from './PlaybackControl';

import style from '../../editors/Editor.module.scss';

export default function TimerControlExport() {
  return (
    <Box className={style.playback}>
      <h1>Timer Control</h1>
      <FiArrowUpRight className={style.corner} onClick={(event) => handleLinks(event, 'timercontrol')} />
      <div className={style.content}>
        <ErrorBoundary>
          <PlaybackControl />
        </ErrorBoundary>
      </div>
    </Box>
  );
}
