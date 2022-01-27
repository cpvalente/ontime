import { useCallback, useEffect, useState } from 'react';
import { useFetch } from '../../app/hooks/useFetch';
import { EVENTS_TABLE } from '../../app/api/apiConstants';
import { fetchAllEvents } from '../../app/api/eventsApi';
import OnTimeTable from './OntimeTable';
import TableHeader from './TableHeader';
import style from './Table.module.scss';
import { useSocket } from '../../app/context/socketContext';
import TableFilter from './TableFilter';

const makeTable = (data) => {
  return data;
};

const extractVisible = (data) => {
  const propertyArray = [];
  for (const d of data) {
    if (d.visible) {
      propertyArray.push(d.accessor);
    }
  }
  return propertyArray;
};

const filterObjects = (data, accessorsToShow) => {
  const filteredData = [];
  for (const d of data) {
    let o = { id: d.id };
    for (const a of accessorsToShow) {
      o[a] = d[a];
    }
    filteredData.push(o);
  }
  return filteredData;
};

const ontimeColumns = () => {
  return [
    { filterable: false, visible: true, width: '1.5em', header: 'Type', accessor: 'type' },
    { filterable: true, visible: true, width: '6em', header: 'Start', accessor: 'timeStart' },
    { filterable: true, visible: true, width: '6em', header: 'End', accessor: 'timeEnd' },
    { filterable: true, visible: true, width: '6em', header: 'Duration', accessor: 'duration' },
    { filterable: true, visible: true, width: '10em', header: 'Title', accessor: 'title' },
    { filterable: true, visible: true, width: '10em', header: 'Subtitle', accessor: 'subtitle' },
    { filterable: true, visible: true, width: '10em', header: 'Presenter', accessor: 'presenter' },
    { filterable: true, visible: true, width: '10em', header: 'Notes', accessor: 'note' },
    { filterable: true, visible: true, width: '2em', header: 'Is Public?', accessor: 'isPublic' },
    { filterable: true, visible: true, width: 'auto', header: 'Light', accessor: 'light' },
    { filterable: true, visible: true, width: 'auto', header: 'Cam', accessor: 'cam' },
    { filterable: true, visible: true, width: 'auto', header: 'Video', accessor: 'video' },
    { filterable: true, visible: true, width: 'auto', header: 'Audio', accessor: 'audio' },
    { filterable: true, visible: true, width: '5em', header: 'Colour', accessor: 'colour' },
  ];
};

export default function TableWrapper() {
  const { data, status, isError, refetch } = useFetch(EVENTS_TABLE, fetchAllEvents);
  const socket = useSocket();
  const [tableData, setTableData] = useState(data || []);
  const [columns, setColumns] = useState(ontimeColumns());
  const [dark, setDark] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (data == null) return;
    setTableData(data);
  }, [data]);

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
    const dataToShow = filterObjects(data, accessors);
    return (
      <div className={dark ? style.tableWrapper__dark : style.tableWrapper}>
        <TableHeader setShowSettings={setShowSettings} setDark={setDark} now='Title Now' />
        {showSettings && <TableFilter columns={columns} handleHide={handleHideField} />}
        <OnTimeTable columns={columns} data={dataToShow} handleHide={handleHideField} />
      </div>
    );
  }
}
