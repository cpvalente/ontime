import { lazy, useEffect } from 'react';
import { useDisclosure } from '@chakra-ui/hooks';
import { Box } from '@chakra-ui/layout';
import ErrorBoundary from 'common/components/errorBoundary/ErrorBoundary';
import ModalManager from 'features/modals/ModalManager';

import UploadModal from '../../common/components/upload-modal/UploadModal';
import { LoggingProvider } from '../../common/context/LoggingContext';
import MenuBar from '../menu/MenuBar';

import styles from './Editor.module.scss';

const EventList = lazy(() => import('features/editors/list/EventListExport'));
const TimerControl = lazy(() => import('features/control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('features/control/message/MessageControlExport'));
const Info = lazy(() => import('features/info/InfoExport'));

export default function Editor() {
  const {
    isOpen: isSettingsOpen,
    onOpen: onSettingsOpen,
    onClose: onSettingsClose,
  } = useDisclosure();

  const {
    isOpen: isUploadModalOpen,
    onOpen: onUploadModalOpen,
    onClose: onUploadModalClose,
  } = useDisclosure();

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Editor';
  }, []);

  return (
    <LoggingProvider>
      <UploadModal onClose={onUploadModalClose} isOpen={isUploadModalOpen} />
      <ErrorBoundary>
        <ModalManager isOpen={isSettingsOpen} onClose={onSettingsClose} />
      </ErrorBoundary>
      <div className={styles.mainContainer}>
        <Box id='settings' className={styles.settings}>
          <ErrorBoundary>
            <MenuBar
              onSettingsOpen={onSettingsOpen}
              isSettingsOpen={isSettingsOpen}
              onSettingsClose={onSettingsClose}
              isUploadOpen={isUploadModalOpen}
              onUploadOpen={onUploadModalOpen}
            />
          </ErrorBoundary>
        </Box>
        <EventList />
        <MessageControl />
        <TimerControl />
        <Info />
      </div>
    </LoggingProvider>
  );
}
