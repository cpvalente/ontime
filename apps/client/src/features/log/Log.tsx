import { LogOrigin } from 'ontime-types';
import { useCallback, useState } from 'react';
import { IoClose } from 'react-icons/io5';

import Button from '../../common/components/buttons/Button';
import { clearLogs, useLogData } from '../../common/stores/logger';
import { cx } from '../../common/utils/styleUtils';
import * as Panel from '../app-settings/panel-utils/PanelUtils';

import style from './Log.module.scss';

const origins = Object.values(LogOrigin);

type OriginFilters = Record<LogOrigin, boolean>;

const allEnabled = Object.fromEntries(origins.map((origin) => [origin, true])) as OriginFilters;

export default function Log() {
  const { logs: logData } = useLogData();
  const isExtracted = window.location.pathname.includes('/log');

  const [filters, setFilters] = useState<OriginFilters>(allEnabled);

  const filteredData = logData.filter((entry) => filters[entry.origin as LogOrigin]);

  const toggleOrigin = useCallback((origin: LogOrigin) => {
    setFilters((prev) => ({ ...prev, [origin]: !prev[origin] }));
  }, []);

  /** middle click solos an origin */
  const soloOrigin = useCallback((toEnable: LogOrigin) => {
    setFilters(Object.fromEntries(origins.map((origin) => [origin, origin === toEnable])) as OriginFilters);
  }, []);

  return (
    <div className={cx([style.container, isExtracted && style.extracted])}>
      <Panel.InlineElements className={style.buttonBar}>
        <span className={style.filterLabel}>Filter by</span>
        {origins.map((origin) => {
          const isEnabled = filters[origin];
          return (
            <Button
              key={origin}
              variant={isEnabled ? 'primary' : 'subtle'}
              size='small'
              aria-pressed={isEnabled}
              aria-label={`${isEnabled ? 'Hide' : 'Show'} ${origin} events`}
              onClick={() => toggleOrigin(origin)}
              onAuxClick={() => soloOrigin(origin)}
              onContextMenu={(e) => e.preventDefault()}
            >
              {origin}
            </Button>
          );
        })}
        <Button variant='subtle-destructive' size='small' onClick={clearLogs} className={style.apart}>
          <IoClose /> Clear
        </Button>
      </Panel.InlineElements>
      <ul className={style.log} aria-label='Event log entries'>
        {filteredData.length === 0 && <li className={style.empty}>No events match the selected filters.</li>}
        {filteredData.map((logEntry) => (
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
