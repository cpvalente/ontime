import { useCallback, useEffect } from 'react';
import { IoApps, IoClose, IoSettingsOutline } from 'react-icons/io5';
import { useDisclosure, useHotkeys } from '@mantine/hooks';

import IconButton from '../../common/components/buttons/IconButton';
import NavigationMenu from '../../common/components/navigation-menu/NavigationMenu';
import ProtectRoute from '../../common/components/protect-route/ProtectRoute';
import { useElectronListener } from '../../common/hooks/useElectronEvent';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import AppSettings from '../../features/app-settings/AppSettings';
import useAppSettingsNavigation from '../../features/app-settings/useAppSettingsNavigation';
import EditorOverview from '../../features/overview/EditorOverview';

import WelcomePlacement from './welcome/WelcomePlacement';
import Editor from './Editor';
import EditorViewOptions from './EditorViewOptions';

import styles from './ProtectedEditor.module.scss';

export default function ProtectedEditor() {
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
      setLocation('settings');
    }
  }, [close, isSettingsOpen, setLocation]);

  useHotkeys([['mod + ,', toggleSettings]]);

  return (
    <ProtectRoute permission='editor'>
      <div className={styles.mainContainer} data-testid='event-editor'>
        <WelcomePlacement />
        <NavigationMenu isOpen={isOpen} onClose={handler.close} />
        {isSettingsOpen ? <AppSettings /> : <Editor />}
        <EditorOverview>
          <IconButton aria-label='Toggle navigation' variant='subtle-white' size='xlarge' onClick={handler.open}>
            <IoApps />
          </IconButton>
          <IconButton aria-label='Toggle settings' variant='subtle-white' size='xlarge' onClick={toggleSettings}>
            {isSettingsOpen ? <IoClose /> : <IoSettingsOutline />}
          </IconButton>
          <EditorViewOptions />
        </EditorOverview>
      </div>
    </ProtectRoute>
  );
}
