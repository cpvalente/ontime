import { useCallback, useMemo, useState } from 'react';
import { IoApps, IoSettingsOutline } from 'react-icons/io5';
import { Modal, ModalContent, ModalOverlay } from '@chakra-ui/react';
import { useDisclosure } from '@mantine/hooks';

import IconButton from '../../common/components/buttons/IconButton';
import NavigationMenu from '../../common/components/navigation-menu/NavigationMenu';
import useViewEditor from '../../common/components/navigation-menu/useViewEditor';
import EmptyPage from '../../common/components/state/EmptyPage';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import { useFlatRundown } from '../../common/hooks-query/useRundown';
import { CuesheetOverview } from '../../features/overview/Overview';
import CuesheetEventEditor from '../../features/rundown/entry-editor/CuesheetEventEditor';

import CuesheetDnd from './cuesheet-dnd/CuesheetDnd';
import CuesheetProgress from './cuesheet-progress/CuesheetProgress';
import { makeCuesheetColumns } from './cuesheet-table/cuesheet-table-elements/cuesheetCols';
import CuesheetTable from './cuesheet-table/CuesheetTable';
import { cuesheetOptions } from './cuesheet.options';

import styles from './CuesheetPage.module.scss';

export default function CuesheetPage() {
  const { data: flatRundown, status: rundownStatus } = useFlatRundown();
  const { data: customFields, status: customFieldStatus } = useCustomFields();
  const { showEditFormDrawer, isViewLocked } = useViewEditor({ isLockable: true });
  const [isMenuOpen, menuHandler] = useDisclosure();
  const [isEventEditorOpen, eventEditorHandler] = useDisclosure();
  const [eventId, setEventId] = useState<string | null>(null);

  const columns = useMemo(() => makeCuesheetColumns(customFields), [customFields]);

  useWindowTitle('Cuesheet');

  /**
   * Handles setting the edit modal target and visibility
   */
  const setShowModal = useCallback(
    (eventId: string | null) => {
      if (eventId) {
        setEventId(eventId);
        eventEditorHandler.open();
      } else {
        setEventId(null);
        eventEditorHandler.close();
      }
    },
    [eventEditorHandler],
  );

  if (!customFields || !flatRundown || rundownStatus === 'pending' || customFieldStatus === 'pending') {
    return <EmptyPage text='Loading...' />;
  }

  return (
    <>
      <Modal isOpen={isEventEditorOpen} onClose={eventEditorHandler.close} variant='ontime'>
        <ModalOverlay />
        <ModalContent maxWidth='max(640px, 40vw)' padding='1rem'>
          <CuesheetEventEditor eventId={eventId!} />
        </ModalContent>
      </Modal>
      <div className={styles.tableWrapper} data-testid='cuesheet'>
        <NavigationMenu isOpen={isMenuOpen} onClose={menuHandler.close} />
        <ViewParamsEditor viewOptions={cuesheetOptions} />
        <CuesheetOverview>
          <IconButton
            aria-label='Toggle navigation'
            variant='subtle-white'
            size='xlarge'
            onClick={menuHandler.open}
            disabled={isViewLocked}
          >
            <IoApps />
          </IconButton>
          <IconButton
            aria-label='Toggle settings'
            variant='subtle-white'
            size='xlarge'
            onClick={showEditFormDrawer}
            disabled={isViewLocked}
          >
            <IoSettingsOutline />
          </IconButton>
        </CuesheetOverview>
        <CuesheetProgress />
        <CuesheetDnd columns={columns}>
          <CuesheetTable data={flatRundown} columns={columns} showModal={setShowModal} />
        </CuesheetDnd>
      </div>
    </>
  );
}
