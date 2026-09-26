import { useDisclosure } from '@mantine/hooks';
import { IoApps } from 'react-icons/io5';

import IconButton from '../../common/components/buttons/IconButton';
import NavigationMenu from '../../common/components/navigation-menu/NavigationMenu';
import { RundownScopeProvider } from '../../common/context/RundownScopeContext';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { getIsNavigationLocked } from '../../externals';
import CuesheetOverview from '../../features/overview/CuesheetOverview';
import EntryEditModal from './cuesheet-edit-modal/EntryEditModal';
import CuesheetProgress from './cuesheet-progress/CuesheetProgress';
import CuesheetTableWrapper from './CuesheetTableWrapper';
import { FOLLOW_LOADED_RUNDOWN_ID, useCuesheetRundownSelection } from './useCuesheetRundownSelection';

import styles from './CuesheetPage.module.scss';

export default function CuesheetPage() {
  'use memo';
  const [isMenuOpen, menuHandler] = useDisclosure();
  const { selectedRundownId, loadedRundownId, setSelectedRundownId, projectRundowns } = useCuesheetRundownSelection();

  useWindowTitle('Cuesheet');

  const isLocked = getIsNavigationLocked();

  return (
    <RundownScopeProvider rundownId={selectedRundownId === FOLLOW_LOADED_RUNDOWN_ID ? null : selectedRundownId}>
      <NavigationMenu isOpen={isMenuOpen} onClose={menuHandler.close} />
      <EntryEditModal />
      <div className={styles.tableWrapper} data-testid='cuesheet'>
        <CuesheetOverview>
          {!isLocked && (
            <IconButton aria-label='Toggle navigation' variant='subtle-white' size='xlarge' onClick={menuHandler.open}>
              <IoApps />
            </IconButton>
          )}
        </CuesheetOverview>
        <CuesheetProgress />
        <CuesheetTableWrapper
          selectedRundownId={selectedRundownId}
          loadedRundownId={loadedRundownId}
          setSelectedRundownId={setSelectedRundownId}
          projectRundowns={projectRundowns}
        />
      </div>
    </RundownScopeProvider>
  );
}
