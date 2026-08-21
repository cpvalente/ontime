import { LogOrigin } from 'ontime-types';
import { useCallback, useState } from 'react';
import { IoClose } from 'react-icons/io5';

import Button from '../../common/components/buttons/Button';
import ToggleButton from '../../common/components/buttons/ToggleButton';
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
        <ToggleButton
          pressed={showUser}
          size='small'
          onClick={() => setShowUser((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.User)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.User}
        </ToggleButton>
        <ToggleButton
          pressed={showClient}
          size='small'
          onClick={() => setShowClient((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Client)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Client}
        </ToggleButton>
        <ToggleButton
          pressed={showServer}
          size='small'
          onClick={() => setShowServer((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Server)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Server}
        </ToggleButton>
        <ToggleButton
          pressed={showPlayback}
          size='small'
          onClick={() => setShowPlayback((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Playback)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Playback}
        </ToggleButton>
        <ToggleButton
          pressed={showRx}
          size='small'
          onClick={() => setShowRx((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Rx)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Rx}
        </ToggleButton>
        <ToggleButton
          pressed={showTx}
          size='small'
          onClick={() => setShowTx((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Tx)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Tx}
        </ToggleButton>
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
