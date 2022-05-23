import React from 'react';
import { Box } from '@chakra-ui/layout';
import ErrorBoundary from '../../../common/components/errorBoundary/ErrorBoundary';
import PlaybackControl from './PlaybackControl';
import styles from '../../editors/Editor.module.scss';

export default function TimerControlExport() {
  return (
    <Box className={styles.playback}>
      <h1>Timer Control</h1>
      <div className={styles.content}>
        <ErrorBoundary>
          <PlaybackControl />
        </ErrorBoundary>
      </div>
    </Box>
  );
}
