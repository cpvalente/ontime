import { lazy, useEffect } from 'react';
import { useDisclosure } from '@chakra-ui/react';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import MenuBar from '../menu/MenuBar';
import AboutModal from '../modals/about-modal/AboutModal';
import QuickStart from '../modals/quick-start/QuickStart';
import SheetsModal from '../modals/sheets-modal/SheetsModal';
import UploadModal from '../modals/upload-modal/UploadModal';

import styles from './Editor.module.scss';

const Rundown = lazy(() => import('../rundown/RundownExport'));
const TimerControl = lazy(() => import('../control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('../control/message/MessageControlExport'));
const Info = lazy(() => import('../info/InfoExport'));
const EventEditor = lazy(() => import('../event-editor/EventEditorExport'));

const IntegrationModal = lazy(() => import('../modals/integration-modal/IntegrationModal'));
const SettingsModal = lazy(() => import('../modals/settings-modal/SettingsModal'));

export default function Editor() {
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const { isOpen: isUploadModalOpen, onOpen: onUploadModalOpen, onClose: onUploadModalClose } = useDisclosure();
  const {
    isOpen: isIntegrationModalOpen,
    onOpen: onIntegrationModalOpen,
    onClose: onIntegrationModalClose,
  } = useDisclosure();
  const { isOpen: isAboutModalOpen, onOpen: onAboutModalOpen, onClose: onAboutModalClose } = useDisclosure();
  const { isOpen: isQuickStartOpen, onOpen: onQuickStartOpen, onClose: onQuickStartClose } = useDisclosure();
  const { isOpen: isSheetsOpen, onOpen: onSheetsOpen, onClose: onSheetsClose } = useDisclosure();

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Editor';
  }, []);

  return (
    <>
      <ErrorBoundary>
        <QuickStart onClose={onQuickStartClose} isOpen={isQuickStartOpen} />
        <UploadModal onClose={onUploadModalClose} isOpen={isUploadModalOpen} />
        <IntegrationModal onClose={onIntegrationModalClose} isOpen={isIntegrationModalOpen} />
        <AboutModal onClose={onAboutModalClose} isOpen={isAboutModalOpen} />
        <SettingsModal isOpen={isSettingsOpen} onClose={onSettingsClose} />
        <SheetsModal onClose={onSheetsClose} isOpen={isSheetsOpen} />
      </ErrorBoundary>
      <div className={styles.mainContainer} data-testid='event-editor'>
        <div id='settings' className={styles.settings}>
          <ErrorBoundary>
            <MenuBar
              onSettingsOpen={onSettingsOpen}
              isSettingsOpen={isSettingsOpen}
              onSettingsClose={onSettingsClose}
              isUploadOpen={isUploadModalOpen}
              onUploadOpen={onUploadModalOpen}
              isIntegrationOpen={isIntegrationModalOpen}
              onIntegrationOpen={onIntegrationModalOpen}
              isAboutOpen={isAboutModalOpen}
              onAboutOpen={onAboutModalOpen}
              isQuickStartOpen={isQuickStartOpen}
              onQuickStartOpen={onQuickStartOpen}
              isSheetsOpen={isSheetsOpen}
              onSheetsOpen={onSheetsOpen}
            />
          </ErrorBoundary>
        </div>
        <Rundown />
        <MessageControl />
        <TimerControl />
        <Info />
      </div>
      <EventEditor />
    </>
  );
}
