import React from 'react';
import { Box } from '@chakra-ui/layout';
import ErrorBoundary from '../../../common/components/errorBoundary/ErrorBoundary';
import MessageControl from './MessageControl';
import styles from '../../editors/Editor.module.scss';

export default function MessageControlExport() {
  return (
    <Box className={styles.messages}>
      <h1>Messages Control</h1>
      <div className={styles.content}>
        <ErrorBoundary>
          <MessageControl />
        </ErrorBoundary>
      </div>
    </Box>
  );
}
