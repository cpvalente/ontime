import { useCallback, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { LogOrigin } from 'ontime-types';

import Button from '../../common/components/buttons/Button';
import { clearLogs, useLogData } from '../../common/stores/logger';
import * as Panel from '../app-settings/panel-utils/PanelUtils';

import style from './Log.module.scss';

export default function Log() {
  const { logs: logData } = useLogData();

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
    <>
      <Panel.InlineElements className={style.buttonBar}>
        <Button
          variant={showUser ? 'primary' : 'subtle'}
          size='small'
          onClick={() => setShowUser((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.User)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.User}
        </Button>
        <Button
          variant={showClient ? 'primary' : 'subtle'}
          size='small'
          onClick={() => setShowClient((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Client)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Client}
        </Button>
        <Button
          variant={showServer ? 'primary' : 'subtle'}
          size='small'
          onClick={() => setShowServer((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Server)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Server}
        </Button>
        <Button
          variant={showPlayback ? 'primary' : 'subtle'}
          size='small'
          onClick={() => setShowPlayback((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Playback)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Playback}
        </Button>
        <Button
          variant={showRx ? 'primary' : 'subtle'}
          size='small'
          onClick={() => setShowRx((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Rx)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Rx}
        </Button>
        <Button
          variant={showTx ? 'primary' : 'subtle'}
          size='small'
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
      <ul className={style.log}>
        {filteredData.map((logEntry) => (
          <li key={logEntry.id} className={`${style.logEntry} ${style[logEntry.level]} `}>
            <span className={style.time}>{logEntry.time}</span>
            <span className={style.origin}>{logEntry.origin}</span>
            <span className={style.msg}>{logEntry.text}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
