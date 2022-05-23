import React from 'react';
import { Box } from '@chakra-ui/layout';
import ErrorBoundary from '../../common/components/errorBoundary/ErrorBoundary';
import Info from './Info';
import styles from '../editors/Editor.module.scss';

export default function InfoExport() {
  return (
    <Box className={styles.info}>
      <h1>Info</h1>
      <div className={styles.content}>
        <ErrorBoundary>
          <Info />
        </ErrorBoundary>
      </div>
    </Box>
  );
}
