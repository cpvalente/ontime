import { lazy, useCallback, useEffect } from 'react';

import ProductionNavigationMenu from '../../common/components/navigation-menu/ProductionNavigationMenu';
import useElectronEvent from '../../common/hooks/useElectronEvent';
import AppSettings from '../app-settings/AppSettings';
import { SettingsOptionId } from '../app-settings/settingsStore';
import useAppSettingsNavigation from '../app-settings/useAppSettingsNavigation';
import Overview from '../overview/Overview';

import styles from './Editor.module.scss';

const Rundown = lazy(() => import('../rundown/RundownExport'));
const TimerControl = lazy(() => import('../control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('../control/message/MessageControlExport'));

export default function Editor() {
  const { isOpen, setLocation, close } = useAppSettingsNavigation();
  const { isElectron } = useElectronEvent();

  const handleSettings = useCallback(
    (newTab?: SettingsOptionId) => {
      if (isOpen) {
        close();
      } else {
        setLocation(newTab ?? 'project');
      }
    },
    [close, isOpen, setLocation],
  );

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // handle held key
      if (event.repeat) return;

      // check if the ctrl key is pressed
      if (event.ctrlKey || event.metaKey) {
        // ctrl + , (settings)
        if (event.key === ',') {
          handleSettings();
          event.preventDefault();
          event.stopPropagation();
        }
      }
    },
    [handleSettings],
  );

  // register ctrl + , to open settings
  useEffect(() => {
    if (isElectron) {
      document.addEventListener('keydown', handleKeyPress);
    }
    return () => {
      if (isElectron) {
        document.removeEventListener('keydown', handleKeyPress);
      }
    };
  }, [handleKeyPress, isElectron]);

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Editor';
  }, []);

  return (
    <div className={styles.mainContainer} data-testid='event-editor'>
      <ProductionNavigationMenu handleSettings={handleSettings} />
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
