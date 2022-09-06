import React, { useCallback, useContext,useEffect } from 'react';

import { EVENTS_TABLE, USERFIELDS } from '../../common/api/apiConstants';
import { fetchAllEvents, requestPatch } from '../../common/api/eventsApi';
import { getUserFields } from '../../common/api/ontimeApi';
import { TableSettingsContext } from '../../common/context/TableSettingsContext';
import { useFetch } from '../../common/hooks/useFetch';
import useMutateEvents from '../../common/hooks/useMutateEvents';
import { useCuesheetProvider } from '../../common/hooks/useSocketProvider';

import OntimeTable from './OntimeTable';
import TableHeader from './TableHeader';
import { makeCSV, makeTable } from './utils';

import style from './Table.module.scss';

export default function TableWrapper() {
  const { data: events } = useFetch(EVENTS_TABLE, fetchAllEvents);
  const { data: userFields } = useFetch(USERFIELDS, getUserFields);
  const mutation = useMutateEvents(requestPatch);
  const { theme } = useContext(TableSettingsContext);
  const featureData = useCuesheetProvider();

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Cuesheet';
  }, []);

  const handleUpdate = useCallback(
    async (rowIndex, accessor, payload) => {
      if (rowIndex == null || accessor == null || payload == null) {
        return;
      }

    // check if value is the same
    const event = events[rowIndex];
    if (event == null) {
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
      await mutation.mutateAsync(mutationObject);
    } catch (error) {
      console.error(error);
    }
  }, [mutation, events]);

  const exportHandler = useCallback(
    (headerData) => {
      if (!headerData || !events || !userFields) {
        return;
      }

      const sheetData = makeTable(headerData, events, userFields);
      const csvContent = makeCSV(sheetData);
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'ontime export.csv');
      document.body.appendChild(link);
      link.click();
    },
    [events, userFields]
  );

  if (typeof events === 'undefined' || typeof userFields === 'undefined') {
    return <span>loading...</span>;
  }
  return (
    <div className={theme === 'dark' ? style.tableWrapper__dark : style.tableWrapper}>
      <TableHeader handleCSVExport={exportHandler} featureData={featureData} />
      <OntimeTable
        tableData={events}
        userFields={userFields}
        handleUpdate={handleUpdate}
        selectedId={featureData.selectedEventId}
      />
    </div>
  );
}
