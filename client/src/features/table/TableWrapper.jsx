import React, { useCallback, useContext, useEffect, useState } from 'react';

import { EVENTS_TABLE, USERFIELDS } from '../../app/api/apiConstants';
import { fetchAllEvents, requestPatch } from '../../app/api/eventsApi';
import { getUserFields } from '../../app/api/ontimeApi';
import { useSocket } from '../../app/context/socketContext';
import { TableSettingsContext } from '../../app/context/TableSettingsContext';
import { useFetch } from '../../app/hooks/useFetch';
import useMutateEvents from '../../app/hooks/useMutateEvents';

import OntimeTable from './OntimeTable';
import TableHeader from './TableHeader';

import style from './Table.module.scss';

export default function TableWrapper() {
  const { data: tableData } = useFetch(EVENTS_TABLE, fetchAllEvents);
  const { data: userFields } = useFetch(USERFIELDS, getUserFields);
  const mutation = useMutateEvents(requestPatch);
  const socket = useSocket();
  const [selectedId, setSelectedId] = useState(null);
  const { theme } = useContext(TableSettingsContext);

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Cuesheet';
  }, []);

  /**
   * Handle incoming data from socket
   */
  useEffect(() => {
    if (socket == null) return;

    // Ask for selected
    socket.emit('get-selected');

    // Handle selected
    socket.on('selected', (data) => {
      setSelectedId(data.id);
    });

    // Clear listener
    return () => {
      socket.off('selected');
    };
  }, [socket]);

  const handleUpdate = useCallback(async (rowIndex, accessor, payload) => {
    if (rowIndex == null || accessor == null || payload == null) {
      return;
    }

    // check if value is the same
    const event = tableData[rowIndex];
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
  }, [mutation, tableData]);

  if (typeof tableData === 'undefined' || typeof userFields === 'undefined') {
    return <span>loading...</span>;
  }
  return (
    <div className={theme === 'dark' ? style.tableWrapper__dark : style.tableWrapper}>
      <TableHeader />
      <OntimeTable
        tableData={tableData}
        userFields={userFields}
        handleUpdate={handleUpdate}
        selectedId={selectedId}
      />
    </div>
  );
}
