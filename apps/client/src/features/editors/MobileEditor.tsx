import { lazy, useCallback, useEffect } from 'react';
import { IoApps, IoClose, IoSettingsOutline } from 'react-icons/io5';
import { IconButton, useDisclosure } from '@chakra-ui/react';
import { useHotkeys } from '@mantine/hooks';

import NavigationMenu from '../../common/components/navigation-menu/NavigationMenu';
import { useElectronListener } from '../../common/hooks/useElectronEvent';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import AppSettings from '../app-settings/AppSettings';
import useAppSettingsNavigation from '../app-settings/useAppSettingsNavigation';

import styles from './Editor.module.scss';
import rundownStyle from '../rundown/RundownExport.module.scss';
import { MobileEditorOverview } from '../overview/MobileOverview';
import { ExternalInput } from '../control/message/MessageControl';
import { ErrorBoundary } from '@sentry/react';

const MobileTimerControl = lazy(() => import('../control/playback/MobileTimerControlExport'));
const MobileRundown = lazy(() => import('../rundown/MobileRundownExport'));
const MobileRundownEventEditor = lazy(() => import('../rundown/event-editor/MobileRundownEventEditor'));
export default function MobileEditor() {
  const { isOpen: isSettingsOpen, setLocation, close } = useAppSettingsNavigation();
  const { isOpen: isMenuOpen, onOpen, onClose } = useDisclosure();
  const { onToggle: onFinderToggle, onClose: onFinderClose } = useDisclosure();

  useWindowTitle('Mobile Editor');

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
      <NavigationMenu isOpen={isMenuOpen} onClose={onClose} />
      <MobileEditorOverview>
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
      </MobileEditorOverview>
      {isSettingsOpen ? (
        <AppSettings />
      ) : (
        <div id='panels' className={styles.panelContainer}>
          <div className={styles.left}>
            <MobileTimerControl />
            <ExternalInput />
            <div className={rundownStyle.side}>
              <ErrorBoundary>
                <MobileRundownEventEditor />
              </ErrorBoundary>
            </div>
          </div>
          <MobileRundown />
        </div>
      )}
    </div>
  );
}
