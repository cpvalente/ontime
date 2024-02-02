import { lazy, useEffect } from 'react';
import { useDisclosure } from '@chakra-ui/react';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import AppSettings from '../app-settings/AppSettings';
import { SettingsOptionId, useSettingsStore } from '../app-settings/settingsStore';
import MenuBar from '../menu/MenuBar';
import QuickStart from '../modals/quick-start/QuickStart';
import SheetsModal from '../modals/sheets-modal/SheetsModal';
import UploadModal from '../modals/upload-modal/UploadModal';
import Overview from '../overview/Overview';

import styles from './Editor.module.scss';

const Rundown = lazy(() => import('../rundown/RundownExport'));
const TimerControl = lazy(() => import('../control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('../control/message/MessageControlExport'));

const IntegrationModal = lazy(() => import('../modals/integration-modal/IntegrationModal'));
const SettingsModal = lazy(() => import('../modals/settings-modal/SettingsModal'));

export default function Editor() {
  const showSettings = useSettingsStore((state) => state.showSettings);
  const setShowSettings = useSettingsStore((state) => state.setShowSettings);

  const handleSettings = (newTab?: SettingsOptionId) => {
    setShowSettings(newTab);
  };

  const { isOpen: isOldSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const { isOpen: isUploadModalOpen, onOpen: onUploadModalOpen, onClose: onUploadModalClose } = useDisclosure();
  const {
    isOpen: isIntegrationModalOpen,
    onOpen: onIntegrationModalOpen,
    onClose: onIntegrationModalClose,
  } = useDisclosure();
  const { isOpen: isQuickStartOpen, onOpen: onQuickStartOpen, onClose: onQuickStartClose } = useDisclosure();
  const { isOpen: isSheetsOpen, onOpen: onSheetsOpen, onClose: onSheetsClose } = useDisclosure();

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Editor';
  }, []);

  const isSettingsOpen = Boolean(showSettings);

  return (
    <>
      <ErrorBoundary>
        <QuickStart onClose={onQuickStartClose} isOpen={isQuickStartOpen} />
        <UploadModal onClose={onUploadModalClose} isOpen={isUploadModalOpen} />
        <IntegrationModal onClose={onIntegrationModalClose} isOpen={isIntegrationModalOpen} />
        <SettingsModal isOpen={isOldSettingsOpen} onClose={onSettingsClose} />
        <SheetsModal onClose={onSheetsClose} isOpen={isSheetsOpen} />
      </ErrorBoundary>
      <div className={styles.mainContainer} data-testid='event-editor'>
        <ErrorBoundary>
          <MenuBar
            isOldSettingsOpen={isOldSettingsOpen}
            onSettingsOpen={onSettingsOpen}
            onSettingsClose={onSettingsClose}
            isUploadOpen={isUploadModalOpen}
            onUploadOpen={onUploadModalOpen}
            isIntegrationOpen={isIntegrationModalOpen}
            onIntegrationOpen={onIntegrationModalOpen}
            isQuickStartOpen={isQuickStartOpen}
            onQuickStartOpen={onQuickStartOpen}
            openSettings={handleSettings}
            isSettingsOpen={isSettingsOpen}
            isSheetsOpen={isSheetsOpen}
            onSheetsOpen={onSheetsOpen}
          />
        </ErrorBoundary>
        {showSettings ? (
          <AppSettings />
        ) : (
          <div id='panels' className={styles.panelContainer}>
            <div className={styles.left}>
              <TimerControl />
              <MessageControl />
            </div>
            <Rundown />
          </div>
        )}
        <Overview />
      </div>
    </>
  );
}
