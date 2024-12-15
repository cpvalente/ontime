import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IconButton, useDisclosure } from '@chakra-ui/react';
import { IoApps } from '@react-icons/all-files/io5/IoApps';
import { IoSettingsOutline } from '@react-icons/all-files/io5/IoSettingsOutline';
import { CustomFieldLabel, isOntimeEvent, OntimeEvent } from 'ontime-types';

import ProductionNavigationMenu from '../../common/components/navigation-menu/ProductionNavigationMenu';
import EmptyPage from '../../common/components/state/EmptyPage';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useEventAction } from '../../common/hooks/useEventAction';
import { useCuesheet } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import { useFlatRundown } from '../../common/hooks-query/useRundown';
import { CuesheetOverview } from '../../features/overview/Overview';

import CuesheetProgress from './cuesheet-progress/CuesheetProgress';
import Cuesheet from './Cuesheet';
import { cuesheetOptions } from './cuesheet.options';
import { makeCuesheetColumns } from './cuesheetCols';

import styles from './CuesheetPage.module.scss';

export default function CuesheetPage() {
  // TODO: can we use the normalised rundown for the table?
  const { data: flatRundown, status: rundownStatus } = useFlatRundown();
  const { data: customFields } = useCustomFields();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen: isMenuOpen, onOpen, onClose } = useDisclosure();

  const { updateCustomField, updateEvent } = useEventAction();
  const featureData = useCuesheet();
  const columns = useMemo(() => makeCuesheetColumns(customFields), [customFields]);

  useWindowTitle('Cuesheet');

  /** Handles showing the view params edit drawer */
  const showEditFormDrawer = useCallback(() => {
    searchParams.set('edit', 'true');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  /**
   * Handles updating a custom field
   */
  const handleUpdateCustom = useCallback(
    async (rowIndex: number, accessor: CustomFieldLabel, payload: string) => {
      if (!flatRundown || rundownStatus !== 'success') {
        return;
      }

      if (rowIndex == null || accessor == null || payload == null) {
        return;
      }

      // check if value is the same
      const event = flatRundown[rowIndex];
      if (!event || !isOntimeEvent(event)) {
        return;
      }

      // skip if there is no value change
      const previousValue = event.custom[accessor];
      if (previousValue === payload) {
        return;
      }
      updateCustomField(event.id, accessor, payload);
    },
    [flatRundown, rundownStatus, updateCustomField],
  );

  /**
   * Handles updating all other string fields
   */
  const handleUpdate = useCallback(
    async (rowIndex: number, accessor: keyof OntimeEvent, payload: string) => {
      if (!flatRundown || rundownStatus !== 'success') {
        return;
      }

      if (rowIndex == null || accessor == null || payload == null) {
        return;
      }

      // check if value is the same
      const event = flatRundown[rowIndex];
      if (!event || !isOntimeEvent(event)) {
        return;
      }

      // skip if there is no value change
      const previousValue = event[accessor];
      if (previousValue === payload) {
        return;
      }

      updateEvent({ id: event.id, [accessor]: payload });
    },
    [flatRundown, rundownStatus, updateEvent],
  );

  if (!customFields || !flatRundown || rundownStatus !== 'success') {
    return <EmptyPage text='Loading...' />;
  }

  return (
    <div className={styles.tableWrapper} data-testid='cuesheet'>
      <ProductionNavigationMenu isMenuOpen={isMenuOpen} onMenuClose={onClose} />
      <ViewParamsEditor viewOptions={cuesheetOptions} />
      <CuesheetOverview>
        <IconButton
          aria-label='Toggle navigation'
          variant='ontime-subtle-white'
          size='lg'
          icon={<IoApps />}
          onClick={onOpen}
        />
        <IconButton
          aria-label='Toggle settings'
          variant='ontime-subtle-white'
          size='lg'
          icon={<IoSettingsOutline />}
          onClick={showEditFormDrawer}
        />
      </CuesheetOverview>
      <CuesheetProgress />
      <Cuesheet
        data={flatRundown}
        columns={columns}
        handleUpdate={handleUpdate}
        handleUpdateCustom={handleUpdateCustom}
        //TODO: stabilizer selectedEventId and currentBlockId
        selectedId={featureData.selectedEventId}
        currentBlockId={featureData.currentBlockId}
      />
    </div>
  );
}
