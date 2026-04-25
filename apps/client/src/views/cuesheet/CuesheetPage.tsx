import { useDisclosure } from '@mantine/hooks';
import { IoApps } from 'react-icons/io5';

import IconButton from '../../common/components/buttons/IconButton';
import NavigationMenu from '../../common/components/navigation-menu/NavigationMenu';
import { EntryActionsProvider } from '../../common/context/EntryActionsContext';
import { useRundownSource } from '../../common/hooks-query/useRundownSource';
import { useEntryActions } from '../../common/hooks/useEntryAction';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { getIsNavigationLocked } from '../../externals';
import CuesheetOverview from '../../features/overview/CuesheetOverview';
import EntryEditModal from './cuesheet-edit-modal/EntryEditModal';
import CuesheetProgress from './cuesheet-progress/CuesheetProgress';
import CuesheetTableWrapper from './CuesheetTableWrapper';
import { useCuesheetRundownSelection } from './useCuesheetRundownSelection';

import styles from './CuesheetPage.module.scss';

export default function CuesheetPage() {
  const [isMenuOpen, menuHandler] = useDisclosure();
  const { selectedRundownId, loadedRundownId } = useCuesheetRundownSelection();
  const source = useRundownSource(selectedRundownId);

  const isCurrentRundown = source.targetRundownId !== null && source.targetRundownId === loadedRundownId;

  const actions = useEntryActions({ targetRundownId: source.targetRundownId });

  useWindowTitle('Cuesheet');

  const isLocked = getIsNavigationLocked();

  return (
    <EntryActionsProvider actions={actions}>
      <NavigationMenu isOpen={isMenuOpen} onClose={menuHandler.close} />
      <EntryEditModal rundown={source.rundown} />
      <div className={styles.tableWrapper} data-testid='cuesheet'>
        <CuesheetOverview>
          {!isLocked && (
            <IconButton aria-label='Toggle navigation' variant='subtle-white' size='xlarge' onClick={menuHandler.open}>
              <IoApps />
            </IconButton>
          )}
        </CuesheetOverview>
        <CuesheetProgress />
        <CuesheetTableWrapper isCurrentRundown={isCurrentRundown} source={source} />
      </div>
    </EntryActionsProvider>
  );
}
