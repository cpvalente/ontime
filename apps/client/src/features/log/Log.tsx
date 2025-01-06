import { useCallback, useState } from 'react';
import { LogOrigin } from 'ontime-types';

import { clearLogs, useLogData } from '../../common/stores/logger';
import { Button } from '../../components/ui/button';

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
    toEnable === LogOrigin.User ? setShowUser(true) : setShowUser(false);
    toEnable === LogOrigin.Client ? setShowClient(true) : setShowClient(false);
    toEnable === LogOrigin.Server ? setShowServer(true) : setShowServer(false);
    toEnable === LogOrigin.Rx ? setShowRx(true) : setShowRx(false);
    toEnable === LogOrigin.Tx ? setShowTx(true) : setShowTx(false);
    toEnable === LogOrigin.Playback ? setShowPlayback(true) : setShowPlayback(false);
  }, []);

  return (
    <>
      <div className={style.buttonBar}>
        <Button
          variant={showUser ? 'ontime-filled' : 'ontime-outlined'}
          size='xs'
          onClick={() => setShowUser((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.User)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.User}
        </Button>
        <Button
          variant={showClient ? 'ontime-filled' : 'ontime-outlined'}
          size='xs'
          onClick={() => setShowClient((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Client)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Client}
        </Button>
        <Button
          variant={showServer ? 'ontime-filled' : 'ontime-outlined'}
          size='xs'
          onClick={() => setShowServer((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Server)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Server}
        </Button>
        <Button
          variant={showPlayback ? 'ontime-filled' : 'ontime-outlined'}
          size='xs'
          onClick={() => setShowPlayback((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Playback)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Playback}
        </Button>
        <Button
          variant={showRx ? 'ontime-filled' : 'ontime-outlined'}
          size='xs'
          onClick={() => setShowRx((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Rx)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Rx}
        </Button>
        <Button
          variant={showTx ? 'ontime-filled' : 'ontime-outlined'}
          size='xs'
          onClick={() => setShowTx((s) => !s)}
          onAuxClick={() => disableOthers(LogOrigin.Tx)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogOrigin.Tx}
        </Button>
        <Button variant='ontime-subtle' size='xs' onClick={clearLogs}>
          Clear
        </Button>
      </div>
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
