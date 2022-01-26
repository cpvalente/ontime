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
    { header: 'Type', accessor: 'type' },
    { header: 'Start Time', accessor: 'timeStart' },
    { header: 'End Time', accessor: 'timeEnd' },
    { header: 'Duration', accessor: 'duration' },
    { header: 'Title', accessor: 'title' },
    { header: 'Sub', accessor: 'subtitle' },
    { header: 'Presenter', accessor: 'presenter' },
    { header: 'Notes', accessor: 'note' },
    { header: 'Is Public?', accessor: 'isPublic' },
    { header: 'Light', accessor: 'col9' },
    { header: 'Cam', accessor: 'col10' },
    { header: 'Video', accessor: 'col11' },
    { header: 'Audio', accessor: 'col12' },
    { header: 'Colour', accessor: 'colour' },
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
            <Checkbox colorScheme='pink'>Events only</Checkbox>
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
