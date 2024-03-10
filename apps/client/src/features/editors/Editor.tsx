import { lazy, useEffect } from 'react';

import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';
import AppSettings from '../app-settings/AppSettings';
import { SettingsOptionId, useSettingsStore } from '../app-settings/settingsStore';
import MenuBar from '../menu/MenuBar';
import Overview from '../overview/Overview';

import styles from './Editor.module.scss';

const Rundown = lazy(() => import('../rundown/RundownExport'));
const TimerControl = lazy(() => import('../control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('../control/message/MessageControlExport'));

export default function Editor() {
  const showSettings = useSettingsStore((state) => state.showSettings);
  const setShowSettings = useSettingsStore((state) => state.setShowSettings);

  const handleSettings = (newTab?: SettingsOptionId) => {
    setShowSettings(newTab);
  };

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Editor';
  }, []);

  const isSettingsOpen = Boolean(showSettings);

  return (
    <div className={styles.mainContainer} data-testid='event-editor'>
      <ErrorBoundary>
        <MenuBar openSettings={handleSettings} isSettingsOpen={isSettingsOpen} />
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
  );
}
