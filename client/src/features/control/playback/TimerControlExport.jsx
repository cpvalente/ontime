import React from 'react';
import { Box } from '@chakra-ui/layout';
import ErrorBoundary from '../../../common/components/errorBoundary/ErrorBoundary';
import PlaybackControl from './PlaybackControl';
import styles from '../../editors/Editor.module.scss';
import style from '../../editors/Editor.module.scss';
import { FiArrowUpRight } from '@react-icons/all-files/fi/FiArrowUpRight';
import { handleLinks } from '../../../common/utils/linkUtils';

export default function TimerControlExport() {
  return (
    <Box className={styles.playback}>
      <h1>Timer Control</h1>
      <FiArrowUpRight className={style.corner} onClick={(event) => handleLinks(event, 'timercontrol')} />
      <div className={styles.content}>
        <ErrorBoundary>
          <PlaybackControl />
        </ErrorBoundary>
      </div>
    </Box>
  );
}
