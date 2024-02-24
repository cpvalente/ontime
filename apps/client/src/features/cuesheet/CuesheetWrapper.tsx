import { useCallback, useEffect, useMemo } from 'react';
import { CustomFieldLabel, isOntimeEvent, ProjectData } from 'ontime-types';

import Empty from '../../common/components/state/Empty';
import { useEventAction } from '../../common/hooks/useEventAction';
import { useCuesheet } from '../../common/hooks/useSocket';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import { useFlatRundown } from '../../common/hooks-query/useRundown';

import CuesheetProgress from './cuesheet-progress/CuesheetProgress';
import CuesheetTableHeader from './cuesheet-table-header/CuesheetTableHeader';
import Cuesheet from './Cuesheet';
import { makeCuesheetColumns } from './cuesheetCols';
import { makeCSV, makeTable } from './cuesheetUtils';

import styles from './CuesheetWrapper.module.scss';

export default function CuesheetWrapper() {
  // TODO: can we use the normalised rundown for the table?
  const { data: flatRundown, status: rundownStatus } = useFlatRundown();
  const { data: customFields } = useCustomFields();

  const { updateCustomField } = useEventAction();
  const featureData = useCuesheet();
  const columns = useMemo(() => makeCuesheetColumns(customFields), [customFields]);

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Cuesheet';
  }, []);

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
        // TODO: create function to mutate user fields
        await updateCustomField(event.id, accessor, cleanVal);
      } catch (error) {
        console.error(error);
      }
    },
    [flatRundown, rundownStatus, updateCustomField],
  );

  const exportHandler = useCallback(
    (headerData: ProjectData) => {
      if (!flatRundown || rundownStatus !== 'success') {
        return;
      }
      const sheetData = makeTable(headerData, flatRundown, customFields);
      const csvContent = makeCSV(sheetData);

      const fileName = 'ontime rundown.csv';

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      // Clean up the URL.createObjectURL to release resources
      URL.revokeObjectURL(url);
      return;
    },
    [flatRundown, rundownStatus, customFields],
  );

  if (!customFields || !flatRundown || rundownStatus !== 'success') {
    return <Empty text='Loading...' />;
  }

  return (
    <div className={styles.tableWrapper} data-testid='cuesheet'>
      <CuesheetTableHeader handleExport={exportHandler} featureData={featureData} />
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
