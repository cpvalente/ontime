import { useDisclosure } from '@mantine/hooks';
import { IoApps } from 'react-icons/io5';

import IconButton from '../../common/components/buttons/IconButton';
import NavigationMenu from '../../common/components/navigation-menu/NavigationMenu';
import { EditableRundownScopeProvider } from '../../common/context/EditableRundownScopeProvider';
import { useRundownSelection } from '../../common/hooks/useRundownSelection';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { getIsNavigationLocked } from '../../externals';
import CuesheetOverview from '../../features/overview/CuesheetOverview';
import EntryEditModal from './cuesheet-edit-modal/EntryEditModal';
import CuesheetProgress from './cuesheet-progress/CuesheetProgress';
import CuesheetTableWrapper from './CuesheetTableWrapper';

import styles from './CuesheetPage.module.scss';

export default function CuesheetPage() {
  'use memo';
  const [isMenuOpen, menuHandler] = useDisclosure();
  const { scopedRundownId, selectedRundownId, loadedRundownId, setSelectedRundownId, projectRundowns } =
    useRundownSelection('cuesheet');

  useWindowTitle('Cuesheet');

  const isLocked = getIsNavigationLocked();

  return (
    <EditableRundownScopeProvider rundownId={scopedRundownId}>
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
    </EditableRundownScopeProvider>
  );
}
