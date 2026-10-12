import { LogLevel, LogOrigin } from 'ontime-types';
import { useMemo, useState } from 'react';
import { IoChevronDown, IoDownloadOutline } from 'react-icons/io5';

import { downloadSessionLog } from '../../common/api/logs';
import { logAxiosError } from '../../common/api/utils';
import Button from '../../common/components/buttons/Button';
import ToggleButton from '../../common/components/buttons/ToggleButton';
import { DropdownMenu } from '../../common/components/dropdown-menu/DropdownMenu';
import Input from '../../common/components/input/input/Input';
import { useServerLog } from '../../common/hooks-query/useServerLog';
import { useLogData } from '../../common/stores/logger';
import { cx } from '../../common/utils/styleUtils';

import style from './Log.module.scss';

const origins = [
  { origin: null, label: 'All' },
  { origin: LogOrigin.Playback, label: 'Playback' },
  { origin: LogOrigin.Automation, label: 'Automations' },
  { origin: LogOrigin.Api, label: 'API' },
  { origin: LogOrigin.Client, label: 'Clients' },
  { origin: LogOrigin.Server, label: 'Server' },
];

async function download(session: 'current' | 'previous') {
  try {
    await downloadSessionLog(session);
  } catch (error) {
    logAxiosError(`Could not download the ${session} session log`, error);
  }
}

export default function Log() {
  const serverLogs = useServerLog();
  const { logs: localLogs } = useLogData();
  const isExtracted = window.location.pathname.includes('/log');

  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const [isProblemsOnly, setIsProblemsOnly] = useState(false);
  const [search, setSearch] = useState('');

  const entries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...serverLogs, ...localLogs]
      .filter(
        (entry) =>
          (!selectedOrigin || entry.origin === selectedOrigin) &&
          (!isProblemsOnly || entry.level !== LogLevel.Info) &&
          (!query || `${entry.origin} ${entry.text}`.toLowerCase().includes(query)),
      )
      .sort((a, b) => b.at - a.at);
  }, [serverLogs, localLogs, selectedOrigin, isProblemsOnly, search]);

  return (
    <div className={cx([style.container, isExtracted && style.extracted])}>
      <div className={style.toolbar}>
        <Input
          className={style.search}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder='Search, eg: failed or cue=12'
          aria-label='Search log entries'
        />
        <DropdownMenu
          render={<Button aria-label='Download log' />}
          items={[
            { type: 'item', label: 'This session', onClick: () => download('current') },
            { type: 'item', label: 'Previous session', onClick: () => download('previous') },
          ]}
        >
          <IoDownloadOutline /> <span className={style.actionLabel}>Download</span> <IoChevronDown />
        </DropdownMenu>
      </div>
      <div className={style.filters} role='group' aria-label='Filter log entries'>
        {origins.map(({ origin, label }) => (
          <ToggleButton
            key={label}
            size='small'
            pressed={selectedOrigin === origin}
            onClick={() => setSelectedOrigin(origin)}
          >
            {label}
          </ToggleButton>
        ))}
        <span className={style.divider} />
        <ToggleButton size='small' pressed={isProblemsOnly} onClick={() => setIsProblemsOnly((current) => !current)}>
          Problems only
        </ToggleButton>
      </div>
      <ul className={style.log} aria-label='Event log entries'>
        {entries.length === 0 && <li className={style.empty}>No entries match the search and filters.</li>}
        {entries.map((logEntry) => (
          <li key={logEntry.id} className={`${style.logEntry} ${style[logEntry.level]}`}>
            <span className={style.time}>{logEntry.time}</span>
            <span className={style.origin}>{logEntry.origin}</span>
            <span className={style.msg}>{logEntry.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
