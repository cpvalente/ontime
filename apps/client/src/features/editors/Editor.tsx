import { lazy, useEffect } from 'react';
import { useDisclosure } from '@chakra-ui/react';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import AppSettings from '../app-settings/AppSettings';
import { SettingsOptionId, useSettingsStore } from '../app-settings/settingsStore';
import MenuBar from '../menu/MenuBar';
import AboutModal from '../modals/about-modal/AboutModal';
import QuickStart from '../modals/quick-start/QuickStart';
import UploadModal from '../modals/upload-modal/UploadModal';

import styles from './Editor.module.scss';

const Rundown = lazy(() => import('../rundown/RundownExport'));
const TimerControl = lazy(() => import('../control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('../control/message/MessageControlExport'));
const Info = lazy(() => import('../info/InfoExport'));
const EventEditor = lazy(() => import('../event-editor/EventEditorExport'));

const IntegrationModal = lazy(() => import('../modals/integration-modal/IntegrationModal'));
const SettingsModal = lazy(() => import('../modals/settings-modal/SettingsModal'));

// TODO: add breakpoints for body font size ??
//       - 15px for normal
//       - 16px for large screens

// TODO: can we delete all the font-family stuff and leave it only at the top?

// TODO: change scrollbar colours to use ontime stuff?

// TODO: rename v2Styles to appStyles?

// TODO: remove onAir as a setting

// TODO: add error boundaries

// TODO: should nav menu have same rules as app settings

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
  const { isOpen: isAboutModalOpen, onOpen: onAboutModalOpen, onClose: onAboutModalClose } = useDisclosure();
  const { isOpen: isQuickStartOpen, onOpen: onQuickStartOpen, onClose: onQuickStartClose } = useDisclosure();

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
        <AboutModal onClose={onAboutModalClose} isOpen={isAboutModalOpen} />
        <SettingsModal isOpen={isOldSettingsOpen} onClose={onSettingsClose} />
      </ErrorBoundary>
      <div className={styles.mainContainer} data-testid='editor-container'>
        <ErrorBoundary>
          <MenuBar
            isOldSettingsOpen={isOldSettingsOpen}
            onSettingsOpen={onSettingsOpen}
            onSettingsClose={onSettingsClose}
            isUploadOpen={isUploadModalOpen}
            onUploadOpen={onUploadModalOpen}
            isIntegrationOpen={isIntegrationModalOpen}
            onIntegrationOpen={onIntegrationModalOpen}
            isAboutOpen={isAboutModalOpen}
            onAboutOpen={onAboutModalOpen}
            isQuickStartOpen={isQuickStartOpen}
            onQuickStartOpen={onQuickStartOpen}
            openSettings={handleSettings}
            isSettingsOpen={isSettingsOpen}
          />
        </ErrorBoundary>
        {showSettings ? (
          <AppSettings />
        ) : (
          <div id='panels' className={styles.panelContainer}>
            <Rundown />
            <MessageControl />
            <TimerControl />
            <Info />
          </div>
        )}
        <div className={styles.overview}>
          <ErrorBoundary></ErrorBoundary>
          {
            // TODO: the information about the event
          }
        </div>
      </div>
      <EventEditor />
    </>
  );
}
