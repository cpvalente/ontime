import { lazy, useEffect } from 'react';
import { useDisclosure } from '@chakra-ui/hooks';
import { Box } from '@chakra-ui/react';
import ErrorBoundary from 'common/components/errorBoundary/ErrorBoundary';
import UploadModal from 'common/components/upload-modal/UploadModal';
import ModalManager from 'features/modals/ModalManager';

import MenuBar from '../menu/MenuBar';

import styles from './Editor.module.scss';

const Rundown = lazy(() => import('features/rundown/RundownExport'));
const TimerControl = lazy(() => import('features/control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('features/control/message/MessageControlExport'));
const Info = lazy(() => import('features/info/InfoExport'));
const EventEditor = lazy(() => import('features/event-editor/EventEditorExport'));

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
    <>
      <UploadModal onClose={onUploadModalClose} isOpen={isUploadModalOpen} />
      <ErrorBoundary>
        <ModalManager isOpen={isSettingsOpen} onClose={onSettingsClose} />
      </ErrorBoundary>
      <div className={styles.mainContainer} data-testid="event-editor">
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
        <Rundown />
        <MessageControl />
        <TimerControl />
        <Info />
      </div>
      <EventEditor />
    </>
  );
}
