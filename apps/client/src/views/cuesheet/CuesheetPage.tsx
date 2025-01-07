import { useCallback, useMemo, useState } from 'react';
import { IoApps } from 'react-icons/io5';
import { IoSettingsOutline } from 'react-icons/io5';
import { useSearchParams } from 'react-router-dom';
import { useDisclosure } from '@chakra-ui/react';

import ProductionNavigationMenu from '../../common/components/navigation-menu/ProductionNavigationMenu';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { open: isMenuOpen, onOpen, onClose } = useDisclosure();
  const { open: isEventEditorOpen, onOpen: onEventEditorOpen, onClose: onEventEditorClose } = useDisclosure();
  const [eventId, setEventId] = useState<string | null>(null);

  const columns = useMemo(() => makeCuesheetColumns(customFields), [customFields]);

  useWindowTitle('Cuesheet');

  /** Handles showing the view params edit drawer */
  const showEditFormDrawer = useCallback(() => {
    searchParams.set('edit', 'true');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

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
        <ProductionNavigationMenu isMenuOpen={isMenuOpen} onMenuClose={onClose} />
        <ViewParamsEditor viewOptions={cuesheetOptions} />
        <CuesheetOverview>
          <IconButton aria-label='Toggle navigation' variant='ontime-subtle-white' size='lg' onClick={onOpen}>
            <IoApps />
          </IconButton>
          <IconButton aria-label='Toggle settings' variant='ontime-subtle-white' size='lg' onClick={showEditFormDrawer}>
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
