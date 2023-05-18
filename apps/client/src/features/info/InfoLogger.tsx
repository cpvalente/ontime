import { useCallback, useState } from 'react';
import { Button } from '@chakra-ui/react';

import { clearLogs, useLogData } from '../../common/stores/logger';

import style from './InfoLogger.module.scss';

enum LogFilter {
  User = 'USER',
  Client = 'CLIENT',
  Server = 'SERVER',
  RX = 'RX',
  TX = 'TX',
  Playback = 'PLAYBACK',
}

export default function InfoLogger() {
  const { logs: logData } = useLogData();

  const [showClient, setShowClient] = useState(true);
  const [showServer, setShowServer] = useState(true);
  const [showRx, setShowRx] = useState(true);
  const [showTx, setShowTx] = useState(true);
  const [showPlayback, setShowPlayback] = useState(true);
  const [showUser, setShowUser] = useState(true);

  const matchers: LogFilter[] = [];
  if (showUser) {
    matchers.push(LogFilter.User);
  }
  if (showClient) {
    matchers.push(LogFilter.Client);
  }
  if (showServer) {
    matchers.push(LogFilter.Server);
  }
  if (showRx) {
    matchers.push(LogFilter.RX);
  }
  if (showTx) {
    matchers.push(LogFilter.TX);
  }
  if (showPlayback) {
    matchers.push(LogFilter.Playback);
  }

  const filteredData = logData.filter((entry) => matchers.some((match) => entry.origin === match));

  const disableOthers = useCallback((toEnable: LogFilter) => {
    toEnable === LogFilter.User ? setShowUser(true) : setShowUser(false);
    toEnable === LogFilter.Client ? setShowClient(true) : setShowClient(false);
    toEnable === LogFilter.Server ? setShowServer(true) : setShowServer(false);
    toEnable === LogFilter.RX ? setShowRx(true) : setShowRx(false);
    toEnable === LogFilter.TX ? setShowTx(true) : setShowTx(false);
    toEnable === LogFilter.Playback ? setShowPlayback(true) : setShowPlayback(false);
  }, []);

  return (
    <>
      <div className={style.buttonBar}>
        <Button
          variant={showUser ? 'ontime-filled' : 'ontime-subtle'}
          size='xs'
          onClick={() => setShowUser((s) => !s)}
          onAuxClick={() => disableOthers(LogFilter.User)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogFilter.User}
        </Button>
        <Button
          variant={showClient ? 'ontime-filled' : 'ontime-subtle'}
          size='xs'
          onClick={() => setShowClient((s) => !s)}
          onAuxClick={() => disableOthers(LogFilter.Client)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogFilter.Client}
        </Button>
        <Button
          variant={showServer ? 'ontime-filled' : 'ontime-subtle'}
          size='xs'
          onClick={() => setShowServer((s) => !s)}
          onAuxClick={() => disableOthers(LogFilter.Server)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogFilter.Server}
        </Button>
        <Button
          variant={showPlayback ? 'ontime-filled' : 'ontime-subtle'}
          size='xs'
          onClick={() => setShowPlayback((s) => !s)}
          onAuxClick={() => disableOthers(LogFilter.Playback)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogFilter.Playback}
        </Button>
        <Button
          variant={showRx ? 'ontime-filled' : 'ontime-subtle'}
          size='xs'
          onClick={() => setShowRx((s) => !s)}
          onAuxClick={() => disableOthers(LogFilter.RX)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogFilter.RX}
        </Button>
        <Button
          variant={showTx ? 'ontime-filled' : 'ontime-subtle'}
          size='xs'
          onClick={() => setShowTx((s) => !s)}
          onAuxClick={() => disableOthers(LogFilter.TX)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {LogFilter.TX}
        </Button>
        <Button variant='ontime-outlined' size='xs' onClick={clearLogs}>
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
