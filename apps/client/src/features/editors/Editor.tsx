import { lazy, useCallback, useEffect } from 'react';
import { IconButton, useDisclosure } from '@chakra-ui/react';
import { IoApps } from '@react-icons/all-files/io5/IoApps';
import { IoClose } from '@react-icons/all-files/io5/IoClose';
import { IoSettingsOutline } from '@react-icons/all-files/io5/IoSettingsOutline';

import ProductionNavigationMenu from '../../common/components/navigation-menu/ProductionNavigationMenu';
import useElectronEvent from '../../common/hooks/useElectronEvent';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import AppSettings from '../app-settings/AppSettings';
import useAppSettingsNavigation from '../app-settings/useAppSettingsNavigation';
import { EditorOverview } from '../overview/Overview';

import styles from './Editor.module.scss';

const Rundown = lazy(() => import('../rundown/RundownExport'));
const TimerControl = lazy(() => import('../control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('../control/message/MessageControlExport'));

export default function Editor() {
  const { isOpen: isSettingsOpen, setLocation, close } = useAppSettingsNavigation();
  const { isElectron } = useElectronEvent();
  const { isOpen: isMenuOpen, onOpen, onClose } = useDisclosure();

  const toggleSettings = useCallback(() => {
    if (isSettingsOpen) {
      close();
    } else {
      setLocation('project');
    }
  }, [close, isSettingsOpen, setLocation]);

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // handle held key
      if (event.repeat) return;

      // check if the ctrl key is pressed
      if (event.ctrlKey || event.metaKey) {
        // ctrl + , (settings)
        if (event.key === ',') {
          toggleSettings();
          event.preventDefault();
          event.stopPropagation();
        }
      }
    },
    [toggleSettings],
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

  useWindowTitle('Editor');

  // listen to shutdown request from electron process
  useEffect(() => {
    if (window.process?.type === 'renderer') {
      window.ipcRenderer.on('user-request-shutdown', () => {
        setLocation('shutdown');
      });
    }
  }, [setLocation]);

  return (
    <div className={styles.mainContainer} data-testid='event-editor'>
      <ProductionNavigationMenu isMenuOpen={isMenuOpen} onMenuClose={onClose} />
      <EditorOverview>
        <IconButton
          aria-label='Toggle navigation'
          variant='ontime-subtle-white'
          size='lg'
          icon={<IoApps />}
          onClick={onOpen}
        />
        <IconButton
          aria-label='Toggle settings'
          variant={isSettingsOpen ? 'ontime-subtle' : 'ontime-subtle-white'}
          size='lg'
          icon={isSettingsOpen ? <IoClose /> : <IoSettingsOutline />}
          onClick={toggleSettings}
        />
      </EditorOverview>
      {isSettingsOpen ? (
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
    </div>
  );
}
