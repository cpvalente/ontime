import { useMemo } from 'react';
import { IoApps } from 'react-icons/io5';
import { useDisclosure } from '@mantine/hooks';

import IconButton from '../../common/components/buttons/IconButton';
import NavigationMenu from '../../common/components/navigation-menu/NavigationMenu';
import useViewEditor from '../../common/components/navigation-menu/useViewEditor';
import EmptyPage from '../../common/components/state/EmptyPage';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import { useFlatRundown } from '../../common/hooks-query/useRundown';
import { CuesheetOverview } from '../../features/overview/Overview';

import CuesheetDnd from './cuesheet-dnd/CuesheetDnd';
import CuesheetEditModal from './cuesheet-edit-modal/CuesheetEditModal';
import CuesheetProgress from './cuesheet-progress/CuesheetProgress';
import { makeCuesheetColumns } from './cuesheet-table/cuesheet-table-elements/cuesheetColsFactory';
import CuesheetTable from './cuesheet-table/CuesheetTable';

import styles from './CuesheetPage.module.scss';

export default function CuesheetPage() {
  const { data: flatRundown, status: rundownStatus } = useFlatRundown();
  const { data: customFields, status: customFieldStatus } = useCustomFields();
  const { isViewLocked } = useViewEditor({ isLockable: true });
  const [isMenuOpen, menuHandler] = useDisclosure();
  const columns = useMemo(() => makeCuesheetColumns(customFields), [customFields]);

  useWindowTitle('Cuesheet');

  const isLoading = !customFields || !flatRundown || rundownStatus === 'pending' || customFieldStatus === 'pending';

  return (
    <>
      <NavigationMenu isOpen={isMenuOpen} onClose={menuHandler.close} />
      <CuesheetEditModal />
      <div className={styles.tableWrapper} data-testid='cuesheet'>
        <CuesheetOverview>
          {!isViewLocked && (
            <IconButton aria-label='Toggle navigation' variant='subtle-white' size='xlarge' onClick={menuHandler.open}>
              <IoApps />
            </IconButton>
          )}
        </CuesheetOverview>
        <CuesheetProgress />
        <CuesheetDnd columns={columns}>
          {isLoading ? <EmptyPage text='Loading...' /> : <CuesheetTable data={flatRundown} columns={columns} />}
        </CuesheetDnd>
      </div>
    </>
  );
}
