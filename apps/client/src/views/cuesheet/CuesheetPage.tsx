import { useCallback, useMemo } from 'react';
import { CustomFieldLabel, isOntimeEvent } from 'ontime-types';

import Empty from '../../common/components/state/Empty';
import { useEventAction } from '../../common/hooks/useEventAction';
import { useCuesheet } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import { useFlatRundown } from '../../common/hooks-query/useRundown';
import { CuesheetOverview } from '../../features/overview/Overview';

import CuesheetProgress from './cuesheet-progress/CuesheetProgress';
import Cuesheet from './Cuesheet';
import { makeCuesheetColumns } from './cuesheetCols';

import styles from './CuesheetPage.module.scss';

export default function CuesheetPage() {
  // TODO: can we use the normalised rundown for the table?
  const { data: flatRundown, status: rundownStatus } = useFlatRundown();
  const { data: customFields } = useCustomFields();

  const { updateCustomField } = useEventAction();
  const featureData = useCuesheet();
  // TODO: the order of the fields comes form the columns
  // TODO: get the order from params (if it exists) and pass to makeCuesheetColumns
  const columns = useMemo(() => makeCuesheetColumns(customFields), [customFields]);

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

      const previousValue = event.custom[accessor];

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
      <CuesheetOverview />
      <CuesheetProgress />
      <Cuesheet
        data={flatRundown}
        columns={columns}
        handleUpdate={handleUpdate}
        selectedId={featureData.selectedEventId}
        currentBlockId={featureData.currentBlockId}
      />
    </div>
  );
}
