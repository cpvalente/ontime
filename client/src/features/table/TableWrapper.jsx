import { useCallback, useEffect, useState } from 'react';
import { useFetch } from '../../app/hooks/useFetch';
import { EVENTS_TABLE } from '../../app/api/apiConstants';
import { fetchAllEvents } from '../../app/api/eventsApi';
import { useLocalStorage } from '../../app/hooks/useLocalStorage';
import { columnOptions } from './defaults';
import { extractVisible, filterObjects } from './utils';
import { useSocket } from '../../app/context/socketContext';
import OntimeTable from './OntimeTable';
import TableHeader from './TableHeader';
import TableFilter from './TableFilter';
import style from './Table.module.scss';

export default function TableWrapper() {
  const { data, status, isError, refetch } = useFetch(EVENTS_TABLE, fetchAllEvents);
  const socket = useSocket();
  const [columns, setColumns] = useLocalStorage('table-options', columnOptions);
  const [theme, setTheme] = useLocalStorage('color-theme', 'dark');
  const [showSettings, setShowSettings] = useState(false);

  const toggleDark = useCallback(
    (val) => {
      console.log('1', val);
      if (val === undefined) {
        if (theme === 'light') {
          setTheme('dark');
        } else {
          setTheme('light');
        }
      } else {
        setTheme(val);
      }
    },
    [setTheme, theme]
  );

  /**
   * Toggles visibility of field in column
   * @param {string} field
   * @param {boolean} [show]
   */
  const handleHideField = useCallback(
    (field, show) => {
      const columnsNow = [...columns];
      const index = columnsNow.findIndex((c) => c.accessor === field);
      if (index >= 0) {
        columnsNow[index].visible = show || !columnsNow[index].visible;
        setColumns(columnsNow);
      }
    },
    [columns]
  );

  if (data == null) return <span>loading</span>;
  else {
    const accessors = extractVisible(columns);
    const dataToShow = filterObjects(data, [...accessors, 'colour']);
    return (
      <div className={theme === 'dark' ? style.tableWrapper__dark : style.tableWrapper}>
        <TableHeader setShowSettings={setShowSettings} setDark={toggleDark} now='Title Now' />
        {showSettings && <TableFilter columns={columns} handleHide={handleHideField} />}
        <OntimeTable
          columns={columns}
          filter={accessors}
          data={dataToShow}
          handleHide={handleHideField}
        />
      </div>
    );
  }
}
