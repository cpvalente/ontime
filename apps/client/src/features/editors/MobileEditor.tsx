import { lazy, useEffect } from 'react';
import { IoApps } from 'react-icons/io5';
import { IconButton, useDisclosure } from '@chakra-ui/react';
import { useHotkeys } from '@mantine/hooks';

import NavigationMenu from '../../common/components/navigation-menu/NavigationMenu';
import { useElectronListener } from '../../common/hooks/useElectronEvent';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import useAppSettingsNavigation from '../app-settings/useAppSettingsNavigation';

import styles from './Editor.module.scss';
import rundownStyle from '../rundown/RundownExport.module.scss';
import { MobileEditorOverview } from '../overview/MobileOverview';
import { ErrorBoundary } from '@sentry/react';

const MobileTimerControl = lazy(() => import('../control/playback/MobileTimerControlExport'));
const MobileRundown = lazy(() => import('../rundown/MobileRundownExport'));
const MobileRundownEventEditor = lazy(() => import('../rundown/event-editor/MobileRundownEventEditor'));
export default function MobileEditor() {
  const { setLocation } = useAppSettingsNavigation();
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


  useHotkeys([
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
      </MobileEditorOverview>
      <div id='panels' className={styles.panelContainer}>
        <div className={styles.left}>
          <MobileTimerControl />
          <div className={rundownStyle.side}>
            <ErrorBoundary>
              <MobileRundownEventEditor hideFooter={true} />
            </ErrorBoundary>
          </div>
        </div>
        <MobileRundown />
      </div>
    </div>
  );
}
