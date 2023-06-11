import { useCallback, useContext, useEffect } from 'react';
import { EventData, OntimeRundownEntry } from 'ontime-types';

import Empty from '../../common/components/state/Empty';
import { TableSettingsContext } from '../../common/context/TableSettingsContext';
import { useEventAction } from '../../common/hooks/useEventAction';
import { useCuesheet } from '../../common/hooks/useSocket';
import useRundown from '../../common/hooks-query/useRundown';
import useUserFields from '../../common/hooks-query/useUserFields';

import TableHeader from './table-header/TableHeader';
import Cuesheet from './Cuesheet';
import { makeCuesheetColumns } from './cuesheetCols';
import OntimeTable from './OntimeTable';
import { makeCSV, makeTable } from './tableUtils';

import style from './Table.module.scss';

export default function TableWrapper() {
  const { data: rundown } = useRundown();
  const { data: userFields } = useUserFields();
  const { updateEvent } = useEventAction();
  const featureData = useCuesheet();
  const { theme } = useContext(TableSettingsContext);

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
    (headerData: EventData) => {
      if (!headerData || !rundown || !userFields) {
        return;
      }

      const sheetData = makeTable(headerData, rundown, userFields);
      const csvContent = makeCSV(sheetData);
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'ontime export.csv');
      document.body.appendChild(link);
      link.click();
    },
    [rundown, userFields],
  );

  if (!rundown || !userFields) {
    return <Empty text='Loading...' />;
  }

  // should be behind use memo
  const columns = makeCuesheetColumns(userFields);

  return (
    <div className={theme === 'dark' ? style.tableWrapper__dark : style.tableWrapper} data-testid='cuesheet'>
      <TableHeader handleCSVExport={exportHandler} featureData={featureData} />
      <Cuesheet data={rundown} columns={columns} handleUpdate={handleUpdate} />
      <OntimeTable
        tableData={rundown}
        userFields={userFields}
        handleUpdate={handleUpdate}
        selectedId={featureData.selectedEventId}
      />
    </div>
  );
}
