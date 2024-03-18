import { lazy, useEffect } from 'react';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import AppSettings from '../app-settings/AppSettings';
import { SettingsOptionId } from '../app-settings/settingsStore';
import useAppSettingsNavigation from '../app-settings/useAppSettingsNavigation';
import MenuBar from '../menu/MenuBar';
import Overview from '../overview/Overview';

import styles from './Editor.module.scss';

const Rundown = lazy(() => import('../rundown/RundownExport'));
const TimerControl = lazy(() => import('../control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('../control/message/MessageControlExport'));

export default function Editor() {
  const { isOpen, setLocation, close } = useAppSettingsNavigation();

  const handleSettings = (newTab?: SettingsOptionId) => {
    if (isOpen) {
      close();
    } else {
      setLocation(newTab ?? 'project');
    }
  };

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Editor';
  }, []);

  return (
    <div className={styles.mainContainer} data-testid='event-editor'>
      <ErrorBoundary>
        <MenuBar openSettings={handleSettings} isSettingsOpen={isOpen} />
      </ErrorBoundary>
      {isOpen ? (
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
  );
}
