import { lazy, useCallback, useEffect } from 'react';
import { IconButton, useDisclosure } from '@chakra-ui/react';
import { useHotkeys } from '@mantine/hooks';
import { IoApps } from '@react-icons/all-files/io5/IoApps';
import { IoClose } from '@react-icons/all-files/io5/IoClose';
import { IoSettingsOutline } from '@react-icons/all-files/io5/IoSettingsOutline';

import ProductionNavigationMenu from '../../common/components/navigation-menu/ProductionNavigationMenu';
import { useElectronListener } from '../../common/hooks/useElectronEvent';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import AppSettings from '../app-settings/AppSettings';
import useAppSettingsNavigation from '../app-settings/useAppSettingsNavigation';
import { EditorOverview } from '../overview/Overview';

import Finder from './finder/Finder';
import WelcomePlacement from './welcome/WelcomePlacement';

import styles from './Editor.module.scss';

const Rundown = lazy(() => import('../rundown/RundownExport'));
const TimerControl = lazy(() => import('../control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('../control/message/MessageControlExport'));

export default function Editor() {
  const { isOpen: isSettingsOpen, setLocation, close } = useAppSettingsNavigation();
  const { isOpen: isMenuOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isFinderOpen, onToggle: onFinderToggle, onClose: onFinderClose } = useDisclosure();

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

  useHotkeys([
    ['mod + ,', toggleSettings],
    ['mod + f', onFinderToggle],
    ['Escape', onFinderClose],
  ]);

  return (
    <div className={styles.mainContainer} data-testid='event-editor'>
      <WelcomePlacement />
      <Finder isOpen={isFinderOpen} onClose={onFinderClose} />
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
