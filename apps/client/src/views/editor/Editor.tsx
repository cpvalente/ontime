import { lazy, useCallback, useEffect } from 'react';
import { IoApps, IoClose, IoSettingsOutline } from 'react-icons/io5';
import { useDisclosure, useHotkeys } from '@mantine/hooks';

import IconButton from '../../common/components/buttons/IconButton';
import NavigationMenu from '../../common/components/navigation-menu/NavigationMenu';
import { useElectronListener } from '../../common/hooks/useElectronEvent';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import AppSettings from '../../features/app-settings/AppSettings';
import useAppSettingsNavigation from '../../features/app-settings/useAppSettingsNavigation';
import EditorOverview from '../../features/overview/EditorOverview';

import WelcomePlacement from './welcome/WelcomePlacement';

import styles from './Editor.module.scss';

const Rundown = lazy(() => import('../../features/rundown/RundownExport'));
const TimerControl = lazy(() => import('../../features/control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('../../features/control/message/MessageControlExport'));

export default function Editor() {
  const { isOpen: isSettingsOpen, setLocation, close } = useAppSettingsNavigation();
  const [isOpen, handler] = useDisclosure();

  useWindowTitle('Editor');

  // we need to register the listener to change the editor location
  useElectronListener();

  // listen to shutdown request from electron process
  useEffect(() => {
    if (window.process?.type === 'renderer') {
      window.ipcRenderer.on('user-request-shutdown', () => {
        setLocation('shutdown');
      });
    }
  }, [setLocation]);

  const toggleSettings = useCallback(() => {
    if (isSettingsOpen) {
      close();
    } else {
      setLocation('project');
    }
  }, [close, isSettingsOpen, setLocation]);

  useHotkeys([['mod + ,', toggleSettings]]);

  return (
    <div className={styles.mainContainer} data-testid='event-editor'>
      <WelcomePlacement />
      <NavigationMenu isOpen={isOpen} onClose={handler.close} />
      <EditorOverview>
        <IconButton aria-label='Toggle navigation' variant='subtle-white' size='xlarge' onClick={handler.open}>
          <IoApps />
        </IconButton>
        <IconButton
          aria-label='Toggle settings'
          variant={isSettingsOpen ? 'subtle' : 'subtle-white'}
          size='xlarge'
          onClick={toggleSettings}
        >
          {isSettingsOpen ? <IoClose /> : <IoSettingsOutline />}
        </IconButton>
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
