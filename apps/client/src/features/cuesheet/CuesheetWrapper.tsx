import { useCallback, useEffect, useMemo } from 'react';
import { OntimeRundownEntry, ProjectData } from 'ontime-types';

import Empty from '../../common/components/state/Empty';
import { useEventAction } from '../../common/hooks/useEventAction';
import { useCuesheet } from '../../common/hooks/useSocket';
import useRundown from '../../common/hooks-query/useRundown';
import useUserFields from '../../common/hooks-query/useUserFields';

import CuesheetTableHeader from './cuesheet-table-header/CuesheetTableHeader';
import Cuesheet from './Cuesheet';
import { makeCuesheetColumns } from './cuesheetCols';
import { makeCSV, makeTable } from './cuesheetUtils';

import styles from './CuesheetWrapper.module.scss';

export default function CuesheetWrapper() {
  const { data: rundown } = useRundown();
  const { data: userFields } = useUserFields();
  const { updateEvent } = useEventAction();
  const featureData = useCuesheet();
  const columns = useMemo(() => makeCuesheetColumns(userFields), [userFields]);

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Cuesheet';
  }, []);

  const handleUpdate = useCallback(
    async (rowIndex: number, accessor: keyof OntimeRundownEntry, payload: unknown) => {
      if (!rundown) {
        return;
      }

      if (rowIndex == null || accessor == null || payload == null) {
        return;
      }

      // check if value is the same
      const event = rundown[rowIndex];
      if (!event) {
        return;
      }

      if (event[accessor] === payload) {
        return;
      }
      // check if value is valid
      // as of now, the fields do not have any validation
      if (typeof payload !== 'string') {
        return;
      }

      // cleanup
      const cleanVal = payload.trim();
      const mutationObject = {
        id: event.id,
        [accessor]: cleanVal,
      };

      // submit
      try {
        await updateEvent(mutationObject);
      } catch (error) {
        console.error(error);
      }
    },
    [updateEvent, rundown],
  );

  const exportHandler = useCallback(
    (headerData: ProjectData) => {
      if (!headerData || !rundown || !userFields) {
        return;
      }

      const sheetData = makeTable(headerData, rundown, userFields);
      const csvContent = makeCSV(sheetData);

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'ontime export.csv');
      document.body.appendChild(link);
      link.click();

      // Clean up the URL.createObjectURL to release resources
      URL.revokeObjectURL(url);
    },
    [rundown, userFields],
  );

  if (!rundown || !userFields) {
    return <Empty text='Loading...' />;
  }

  return (
    <div className={styles.tableWrapper} data-testid='cuesheet'>
      <CuesheetTableHeader handleCSVExport={exportHandler} featureData={featureData} />
      <Cuesheet data={rundown} columns={columns} handleUpdate={handleUpdate} selectedId={featureData.selectedEventId} />
    </div>
  );
}
