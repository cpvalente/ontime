import { lazy, useEffect } from 'react';
import { Box, useDisclosure } from '@chakra-ui/react';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import UploadModal from '../../common/components/upload-modal/UploadModal';
import MenuBar from '../menu/MenuBar';
import IntegrationModal from '../modals/integration-modal/IntegrationModal';
import ModalManager from '../modals/ModalManager';

import styles from './Editor.module.scss';

const Rundown = lazy(() => import('../../features/rundown/RundownExport'));
const TimerControl = lazy(() => import('../../features/control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('../../features/control/message/MessageControlExport'));
const Info = lazy(() => import('../../features/info/InfoExport'));
const EventEditor = lazy(() => import('../../features/event-editor/EventEditorExport'));

export default function Editor() {
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const { isOpen: isUploadModalOpen, onOpen: onUploadModalOpen, onClose: onUploadModalClose } = useDisclosure();
  const {
    isOpen: isIntegrationModalOpen,
    onOpen: onIntegrationModalOpen,
    onClose: onIntegrationModalClose,
  } = useDisclosure();

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Editor';
  }, []);

  return (
    <>
      <UploadModal onClose={onUploadModalClose} isOpen={isUploadModalOpen} />
      <IntegrationModal onClose={onIntegrationModalClose} isOpen={isIntegrationModalOpen} />
      <ErrorBoundary>
        <ModalManager isOpen={isSettingsOpen} onClose={onSettingsClose} />
      </ErrorBoundary>
      <div className={styles.mainContainer} data-testid='event-editor'>
        <Box id='settings' className={styles.settings}>
          <ErrorBoundary>
            <MenuBar
              onSettingsOpen={onSettingsOpen}
              isSettingsOpen={isSettingsOpen}
              onSettingsClose={onSettingsClose}
              isUploadOpen={isUploadModalOpen}
              onUploadOpen={onUploadModalOpen}
              isIntegrationOpen={isIntegrationModalOpen}
              onIntegrationOpen={onIntegrationModalOpen}
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
