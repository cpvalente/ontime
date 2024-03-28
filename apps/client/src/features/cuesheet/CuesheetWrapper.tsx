import { useCallback, useEffect, useMemo } from 'react';
import { IconButton, useDisclosure } from '@chakra-ui/react';
import { IoApps } from '@react-icons/all-files/io5/IoApps';
import { IoSettingsOutline } from '@react-icons/all-files/io5/IoSettingsOutline';
import { CustomFieldLabel, isOntimeEvent } from 'ontime-types';

import ProductionNavigationMenu from '../../common/components/navigation-menu/ProductionNavigationMenu';
import Empty from '../../common/components/state/Empty';
import { useEventAction } from '../../common/hooks/useEventAction';
import { useCuesheet } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import { useFlatRundown } from '../../common/hooks-query/useRundown';
import Overview from '../overview/Overview';

import CuesheetProgress from './cuesheet-progress/CuesheetProgress';
import { useCuesheetSettings } from './store/CuesheetSettings';
import Cuesheet from './Cuesheet';
import { makeCuesheetColumns } from './cuesheetCols';

import styles from './CuesheetWrapper.module.scss';

export default function CuesheetWrapper() {
  // TODO: can we use the normalised rundown for the table?
  const { data: flatRundown, status: rundownStatus } = useFlatRundown();
  const { data: customFields } = useCustomFields();
  const { isOpen: isMenuOpen, onOpen, onClose } = useDisclosure();

  const { updateCustomField } = useEventAction();
  const featureData = useCuesheet();
  const columns = useMemo(() => makeCuesheetColumns(customFields), [customFields]);
  const toggleSettings = useCuesheetSettings((state) => state.toggleSettings);

  useWindowTitle('Cuesheet');

  /**
   * Handles updating a field
   * Currently, only custom fields can be updated from the cuesheet
   */
  const handleUpdate = useCallback(
    async (rowIndex: number, accessor: CustomFieldLabel, payload: unknown) => {
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

      const previousValue = event.custom[accessor]?.value;

      if (previousValue === payload) {
        return;
      }

      // check if value is valid
      // in anticipation to different types of event here
      if (typeof payload !== 'string') {
        return;
      }

      // cleanup
      const cleanVal = payload.trim();

      // submit
      try {
        await updateCustomField(event.id, accessor, cleanVal);
      } catch (error) {
        console.error(error);
      }
    },
    [flatRundown, rundownStatus, updateCustomField],
  );

  if (!customFields || !flatRundown || rundownStatus !== 'success') {
    return <Empty text='Loading...' />;
  }

  return (
    <div className={styles.tableWrapper} data-testid='cuesheet'>
      <ProductionNavigationMenu isMenuOpen={isMenuOpen} onMenuClose={onClose} />
      <Overview>
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
      </Overview>
      <CuesheetProgress />
      <Cuesheet
        data={flatRundown}
        columns={columns}
        handleUpdate={handleUpdate}
        selectedId={featureData.selectedEventId}
      />
    </div>
  );
}
