import { useCallback, useMemo, useState } from 'react';
import { IoApps } from 'react-icons/io5';
import { IoSettingsOutline } from 'react-icons/io5';
import { useDisclosure } from '@chakra-ui/react';

import NavigationMenu from '../../common/components/navigation-menu/NavigationMenu';
import useViewEditor from '../../common/components/navigation-menu/useViewEditor';
import EmptyPage from '../../common/components/state/EmptyPage';
import { DialogBackdrop, DialogBody, DialogContent, DialogRoot } from '../../common/components/ui/dialog';
import { IconButton } from '../../common/components/ui/icon-button';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import { useFlatRundown } from '../../common/hooks-query/useRundown';
import { CuesheetOverview } from '../../features/overview/Overview';
import CuesheetEventEditor from '../../features/rundown/event-editor/CuesheetEventEditor';

import CuesheetDnd from './cuesheet-dnd/CuesheetDnd';
import CuesheetProgress from './cuesheet-progress/CuesheetProgress';
import { makeCuesheetColumns } from './cuesheet-table/cuesheet-table-elements/cuesheetCols';
import CuesheetTable from './cuesheet-table/CuesheetTable';
import { cuesheetOptions } from './cuesheet.options';

import styles from './CuesheetPage.module.scss';

export default function CuesheetPage() {
  // TODO: can we use the normalised rundown for the table?
  const { data: flatRundown } = useFlatRundown();
  const { data: customFields } = useCustomFields();
  const { showEditFormDrawer, isViewLocked } = useViewEditor({ isLockable: true });
  const { open: isEventEditorOpen, onOpen: onEventEditorOpen, onClose: onEventEditorClose } = useDisclosure();
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
        onEventEditorOpen();
      } else {
        setEventId(null);
        onEventEditorClose();
      }
    },
    [onEventEditorClose, onEventEditorOpen],
  );

  if (!customFields || !flatRundown) {
    return <EmptyPage text='Loading...' />;
  }

  return (
    <>
      <DialogRoot open={isEventEditorOpen} onOpenChange={onEventEditorClose}>
        <DialogBackdrop />
        <DialogContent maxWidth='max(640px, 40vw)' padding='1rem'>
          <DialogBody>
            <CuesheetEventEditor eventId={eventId!} />
          </DialogBody>
        </DialogContent>
      </DialogRoot>
      <div className={styles.tableWrapper} data-testid='cuesheet'>
        <NavigationMenu isOpen={isEventEditorOpen} onClose={onEventEditorClose} />
        <ViewParamsEditor viewOptions={cuesheetOptions} />
        <CuesheetOverview>
          <IconButton
            aria-label='Toggle navigation'
            variant='ontime-subtle-white'
            size='lg'
            onClick={onEventEditorOpen}
            disabled={isViewLocked}
          >
            <IoApps />
          </IconButton>
          <IconButton
            aria-label='Toggle settings'
            variant='ontime-subtle-white'
            size='lg'
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
