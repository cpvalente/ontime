import { useCallback, useMemo } from 'react';
import { IconButton, useDisclosure } from '@chakra-ui/react';
import { IoApps } from '@react-icons/all-files/io5/IoApps';
import { IoSettingsOutline } from '@react-icons/all-files/io5/IoSettingsOutline';
import { CustomFieldLabel, isOntimeEvent, OntimeEvent } from 'ontime-types';

import ProductionNavigationMenu from '../../common/components/navigation-menu/ProductionNavigationMenu';
import Empty from '../../common/components/state/Empty';
import { useEventAction } from '../../common/hooks/useEventAction';
import { useCuesheet } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import { useFlatRundown } from '../../common/hooks-query/useRundown';
import { CuesheetOverview } from '../../features/overview/Overview';

import CuesheetProgress from './cuesheet-progress/CuesheetProgress';
import { useCuesheetSettings } from './store/cuesheetSettingsStore';
import Cuesheet from './Cuesheet';
import { makeCuesheetColumns } from './cuesheetCols';

import styles from './CuesheetPage.module.scss';

export default function CuesheetPage() {
  // TODO: can we use the normalised rundown for the table?
  const { data: flatRundown, status: rundownStatus } = useFlatRundown();
  const { data: customFields } = useCustomFields();
  const { isOpen: isMenuOpen, onOpen, onClose } = useDisclosure();

  const { updateCustomField, updateEvent } = useEventAction();
  const featureData = useCuesheet();
  const columns = useMemo(() => makeCuesheetColumns(customFields), [customFields]);
  const toggleSettings = useCuesheetSettings((state) => state.toggleSettings);

  useWindowTitle('Cuesheet');

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
      console.log(rowIndex, accessor, payload);
      console.log(event.id, accessor, payload);
      updateCustomField(event.id, accessor, payload);
    },
    [flatRundown, rundownStatus, updateCustomField],
  );

  /**
   * Handles updating fields
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
    return <Empty text='Loading...' />;
  }

  return (
    <div className={styles.tableWrapper} data-testid='cuesheet'>
      <ProductionNavigationMenu isMenuOpen={isMenuOpen} onMenuClose={onClose} />
      <CuesheetOverview>
        <IconButton
          aria-label='Toggle settings'
          variant='ontime-subtle-white'
          size='lg'
          icon={<IoApps />}
          onClick={onOpen}
        />
        <IconButton
          aria-label='Toggle navigation'
          variant='ontime-subtle-white'
          size='lg'
          icon={<IoSettingsOutline />}
          onClick={() => toggleSettings()}
        />
      </CuesheetOverview>
      <CuesheetProgress />
      <Cuesheet
        data={flatRundown}
        columns={columns}
        handleUpdate={handleUpdate}
        handleUpdateCustom={handleUpdateCustom}
        selectedId={featureData.selectedEventId}
        currentBlockId={featureData.currentBlockId}
      />
    </div>
  );
}
