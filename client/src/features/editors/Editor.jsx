import React, { lazy, useEffect } from 'react';
import { useDisclosure } from '@chakra-ui/hooks';
import ModalManager from 'features/modals/ModalManager';
import ErrorBoundary from 'common/components/errorBoundary/ErrorBoundary';
import { LoggingProvider } from '../../app/context/LoggingContext';
import { LocalEventSettingsProvider } from '../../app/context/LocalEventSettingsContext';
import styles from './Editor.module.scss';

const EventList = lazy(() => import('features/editors/list/EventListExport'));
const TimerControl = lazy(() => import('features/control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('features/control/message/MessageControlExport'));
const Info = lazy(() => import('features/info/InfoExport'));

export default function Editor() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Editor';
  }, []);

  return (
    <LoggingProvider>
      <LocalEventSettingsProvider>
        <ErrorBoundary>
          <ModalManager isOpen={isOpen} onClose={onClose} />
        </ErrorBoundary>
        <div className={styles.mainContainer}>
          <EventList onOpen={onOpen} isOpen={isOpen} onClose={onClose} />
          <MessageControl />
          <TimerControl />
          <Info />
        </div>
      </LocalEventSettingsProvider>
    </LoggingProvider>
  );
}
