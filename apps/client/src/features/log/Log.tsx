import { LogLevel, LogOrigin } from 'ontime-types';
import { useCallback, useState } from 'react';
import { IoClose } from 'react-icons/io5';

import Button from '../../common/components/buttons/Button';
import Input from '../../common/components/input/input/Input';
import { clearLogs, useLogData } from '../../common/stores/logger';
import * as Panel from '../app-settings/panel-utils/PanelUtils';

import style from './Log.module.scss';

const allOrigins = [
  LogOrigin.User,
  LogOrigin.Client,
  LogOrigin.Server,
  LogOrigin.Playback,
  LogOrigin.Rx,
  LogOrigin.Tx,
];

export default function Log() {
  const { logs: logData } = useLogData();

  // log entries are not guaranteed to have an origin from the enum
  const [origins, setOrigins] = useState<Set<string>>(() => new Set<string>(allOrigins));
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [search, setSearch] = useState('');

  const toggleOrigin = useCallback((origin: LogOrigin) => {
    setOrigins((previous) => {
      const newOrigins = new Set(previous);
      if (newOrigins.has(origin)) {
        newOrigins.delete(origin);
      } else {
        newOrigins.add(origin);
      }
      return newOrigins;
    });
  }, []);

  /** middle click on an origin shows only that origin */
  const showOnlyOrigin = useCallback((origin: LogOrigin) => {
    setOrigins(new Set([origin]));
  }, []);

  const searchTerm = search.toLowerCase();
  const filteredData = logData.filter((entry) => {
    if (!origins.has(entry.origin)) return false;
    if (onlyProblems && entry.level === LogLevel.Info) return false;
    if (searchTerm && !entry.text.toLowerCase().includes(searchTerm)) return false;
    return true;
  });

  const isFiltered = filteredData.length !== logData.length;

  return (
    <>
      <Panel.InlineElements className={style.buttonBar}>
        {allOrigins.map((origin) => (
          <Button
            key={origin}
            variant={origins.has(origin) ? 'primary' : 'subtle'}
            size='small'
            onClick={() => toggleOrigin(origin)}
            onAuxClick={() => showOnlyOrigin(origin)}
            onContextMenu={(event) => event.preventDefault()}
          >
            {origin}
          </Button>
        ))}
        <Button
          variant={onlyProblems ? 'primary' : 'subtle'}
          size='small'
          onClick={() => setOnlyProblems((previous) => !previous)}
        >
          Issues only
        </Button>
        <Button variant='subtle-destructive' size='small' onClick={clearLogs} className={style.apart}>
          <IoClose /> Clear
        </Button>
      </Panel.InlineElements>
      <Panel.InlineElements className={style.buttonBar}>
        <Input fluid placeholder='Filter messages' value={search} onChange={(event) => setSearch(event.target.value)} />
        <span className={style.count}>
          {isFiltered ? `${filteredData.length} of ${logData.length}` : logData.length} entries
        </span>
      </Panel.InlineElements>
      <ul className={style.log}>
        {filteredData.map((logEntry) => (
          <li key={logEntry.id} className={`${style.logEntry} ${style[logEntry.level]} `}>
            <span className={style.time}>{logEntry.time}</span>
            <span className={style.origin}>{logEntry.origin}</span>
            <span className={style.msg}>{logEntry.text}</span>
          </li>
        ))}
        {filteredData.length === 0 && (
          <li className={style.empty}>{logData.length === 0 ? 'No activity yet' : 'No entries match the filters'}</li>
        )}
      </ul>
    </>
  );
}
