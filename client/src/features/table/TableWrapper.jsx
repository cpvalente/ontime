import { useMemo, useState } from 'react';
import { useFetch } from '../../app/hooks/useFetch';
import { EVENTS_TABLE } from '../../app/api/apiConstants';
import { fetchAllEvents } from '../../app/api/eventsApi';
import OnTimeTable from './OntimeTable';
import TableHeader from './TableHeader';
import style from './Table.module.scss';
import { useSocket } from '../../app/context/socketContext';
import { Checkbox } from '@chakra-ui/react';

const makeTable = (data) => {
  return [
    {
      type: 'Event',
      timeStart: 'Start Time',
      timeEnd: 'End Time',
      duration: 'Duration',
      title: 'Title',
      subtitle: 'Sub',
      presenter: 'Presenter',
      note: 'Notes',
      isPublic: 'Is Public?',
      col9: 'Light',
      col10: 'Cam',
      col11: 'Video',
      col12: 'Audio',
      colour: 'Colour',
    },
  ];
};

const ontimeColumns = () => {
  return [
    { width: '1.5em', header: 'Type', accessor: 'type' },
    { width: '6em', header: 'Start Time', accessor: 'timeStart' },
    { width: '6em', header: 'End Time', accessor: 'timeEnd' },
    { width: '6em', header: 'Duration', accessor: 'duration' },
    { width: '10em', header: 'Title', accessor: 'title' },
    { width: '10em', header: 'Subtitle', accessor: 'subtitle' },
    { width: '10em', header: 'Presenter', accessor: 'presenter' },
    { width: '10em', header: 'Notes', accessor: 'note' },
    { width: '2em', header: 'Is Public?', accessor: 'isPublic' },
    { width: 'auto', header: 'Light', accessor: 'col9' },
    { width: 'auto', header: 'Cam', accessor: 'col10' },
    { width: 'auto', header: 'Video', accessor: 'col11' },
    { width: 'auto', header: 'Audio', accessor: 'col12' },
    { width: '5em', header: 'Colour', accessor: 'colour' },
  ];
};

export default function TableWrapper() {
  const { data, status, isError, refetch } = useFetch(EVENTS_TABLE, fetchAllEvents);
  const socket = useSocket();
  const tableData = useMemo(() => makeTable(data), [data]);
  const columns = ontimeColumns();
  const [dark, setDark] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (data == null) return <span>loading</span>;
  else {
    return (
      <div className={dark ? style.tableWrapper__dark : style.tableWrapper}>
        <TableHeader setShowSettings={setShowSettings} setDark={setDark} now='Title Now' />
        {showSettings && (
          <div className={style.tableSettings}>
            <Checkbox>Events only</Checkbox>
            <Checkbox>Start Time</Checkbox>
            <Checkbox>End Time</Checkbox>
            <Checkbox>Duration</Checkbox>
            <Checkbox>Title</Checkbox>
            <Checkbox>Sub</Checkbox>
            <Checkbox>Presenter</Checkbox>
            <Checkbox>Notes</Checkbox>
            <Checkbox>Is Public</Checkbox>
            <Checkbox>Light</Checkbox>
            <Checkbox>Cam</Checkbox>
            <Checkbox>Video</Checkbox>
            <Checkbox>Audio</Checkbox>
            <Checkbox>Colour</Checkbox>
          </div>
        )}
        <OnTimeTable columns={columns} data={data} />
      </div>
    );
  }
}
