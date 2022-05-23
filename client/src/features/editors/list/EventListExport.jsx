import React from 'react';
import { CursorProvider } from '../../../app/context/CursorContext';
import { CollapseProvider } from '../../../app/context/CollapseContext';
import { Box } from '@chakra-ui/layout';
import ErrorBoundary from '../../../common/components/errorBoundary/ErrorBoundary';
import MenuBar from '../../menu/MenuBar';
import styles from '../Editor.module.scss';
import PropTypes from 'prop-types';
import EventListWrapper from './EventListWrapper';

export default function EventListExport(props) {
  const { onOpen, isOpen, onClose } = props;
  return (
    <CursorProvider>
      <CollapseProvider>
        <Box id='settings' className={styles.settings}>
          <ErrorBoundary>
            <MenuBar onOpen={onOpen} isOpen={isOpen} onClose={onClose} />
          </ErrorBoundary>
        </Box>

        <Box className={styles.editor}>
          <h1>Event List</h1>
          <ErrorBoundary>
            <EventListWrapper />
          </ErrorBoundary>
        </Box>
      </CollapseProvider>
    </CursorProvider>
  );
}

EventListExport.propTypes = {
  onOpen: PropTypes.func,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
};
