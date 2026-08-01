import { LogOrigin } from 'ontime-types';
import { useCallback, useState } from 'react';
import { IoClose } from 'react-icons/io5';

import Button from '../../common/components/buttons/Button';
import { clearLogs, useLogData } from '../../common/stores/logger';
import { cx } from '../../common/utils/styleUtils';
import * as Panel from '../app-settings/panel-utils/PanelUtils';

import style from './Log.module.scss';

export default function Log() {
  const { logs: logData } = useLogData();
  const isExtracted = window.location.pathname.includes('/log');

  const [showClient, setShowClient] = useState(true);
  const [showServer, setShowServer] = useState(true);
  const [showRx, setShowRx] = useState(true);
  const [showTx, setShowTx] = useState(true);
  const [showPlayback, setShowPlayback] = useState(true);
  const [showUser, setShowUser] = useState(true);

  const matchers: LogOrigin[] = [];
  if (showUser) {
    matchers.push(LogOrigin.User);
  }
  if (showClient) {
    matchers.push(LogOrigin.Client);
  }
  if (showServer) {
    matchers.push(LogOrigin.Server);
  }
  if (showRx) {
    matchers.push(LogOrigin.Rx);
  }
  if (showTx) {
    matchers.push(LogOrigin.Tx);
  }
  if (showPlayback) {
    matchers.push(LogOrigin.Playback);
  }

  const filteredData = logData.filter((entry) => matchers.some((match) => entry.origin === match));

  const disableOthers = useCallback((toEnable: LogOrigin) => {
    setShowUser(toEnable === LogOrigin.User);
    setShowClient(toEnable === LogOrigin.Client);
    setShowServer(toEnable === LogOrigin.Server);
    setShowRx(toEnable === LogOrigin.Rx);
    setShowTx(toEnable === LogOrigin.Tx);
    setShowPlayback(toEnable === LogOrigin.Playback);
  }, []);

  return (
    <div className={cx([style.container, isExtracted && style.extracted])}>
      <Panel.InlineElements className={style.buttonBar}>
        <span className={style.filterLabel}>Filter by</span>
        <Button
          variant={showUser ? 'primary' : 'subtle'}
          size='small'
          aria-pressed={showUser}
          aria-label={`${showUser ? 'Hide' : 'Show'} ${LogOrigin.User} events`}
          onClick={() => setShowUser((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.User)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.User}
        </Button>
        <Button
          variant={showClient ? 'primary' : 'subtle'}
          size='small'
          aria-pressed={showClient}
          aria-label={`${showClient ? 'Hide' : 'Show'} ${LogOrigin.Client} events`}
          onClick={() => setShowClient((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Client)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Client}
        </Button>
        <Button
          variant={showServer ? 'primary' : 'subtle'}
          size='small'
          aria-pressed={showServer}
          aria-label={`${showServer ? 'Hide' : 'Show'} ${LogOrigin.Server} events`}
          onClick={() => setShowServer((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Server)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Server}
        </Button>
        <Button
          variant={showPlayback ? 'primary' : 'subtle'}
          size='small'
          aria-pressed={showPlayback}
          aria-label={`${showPlayback ? 'Hide' : 'Show'} ${LogOrigin.Playback} events`}
          onClick={() => setShowPlayback((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Playback)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Playback}
        </Button>
        <Button
          variant={showRx ? 'primary' : 'subtle'}
          size='small'
          aria-pressed={showRx}
          aria-label={`${showRx ? 'Hide' : 'Show'} ${LogOrigin.Rx} events`}
          onClick={() => setShowRx((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Rx)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Rx}
        </Button>
        <Button
          variant={showTx ? 'primary' : 'subtle'}
          size='small'
          aria-pressed={showTx}
          aria-label={`${showTx ? 'Hide' : 'Show'} ${LogOrigin.Tx} events`}
          onClick={() => setShowTx((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Tx)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Tx}
        </Button>
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
