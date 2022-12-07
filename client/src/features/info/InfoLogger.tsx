import { useCallback, useContext, useEffect, useState } from 'react';
import { Button } from '@chakra-ui/react';

import CollapseBar from '../../common/components/collapseBar/CollapseBar';
import { Log, LoggingContext } from '../../common/context/LoggingContext';

import style from './InfoLogger.module.scss';

enum LOG_FILTER {
  USER = 'USER',
  CLIENT = 'CLIENT',
  SERVER = 'SERVER',
  RX = 'RX',
  TX = 'TX',
  PLAYBACK = 'PLAYBACK',
}

export default function InfoLogger() {
  const { logData, clearLog } = useContext(LoggingContext);
  const [data, setData] = useState<Log[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [showClient, setShowClient] = useState(true);
  const [showServer, setShowServer] = useState(true);
  const [showRx, setShowRx] = useState(true);
  const [showTx, setShowTx] = useState(true);
  const [showPlayback, setShowPlayback] = useState(true);
  const [showUser, setShowUser] = useState(true);

  useEffect(() => {
    if (!logData) {
      return;
    }

    const matchers: LOG_FILTER[] = [];
    if (showUser) {
      matchers.push(LOG_FILTER.USER);
    }
    if (showClient) {
      matchers.push(LOG_FILTER.CLIENT);
    }
    if (showServer) {
      matchers.push(LOG_FILTER.SERVER);
    }
    if (showRx) {
      matchers.push(LOG_FILTER.RX);
    }
    if (showTx) {
      matchers.push(LOG_FILTER.TX);
    }
    if (showPlayback) {
      matchers.push(LOG_FILTER.PLAYBACK);
    }

    const filteredData = logData.filter((entry) => matchers.some((match) => entry.origin === match));
    setData(filteredData);
  }, [logData, showUser, showClient, showServer, showPlayback, showRx, showTx]);

  const disableOthers = useCallback((toEnable: LOG_FILTER) => {
    toEnable === LOG_FILTER.USER ? setShowUser(true) : setShowUser(false);
    toEnable === LOG_FILTER.CLIENT ? setShowClient(true) : setShowClient(false);
    toEnable === LOG_FILTER.SERVER ? setShowServer(true) : setShowServer(false);
    toEnable === LOG_FILTER.RX ? setShowRx(true) : setShowRx(false);
    toEnable === LOG_FILTER.TX ? setShowTx(true) : setShowTx(false);
    toEnable === LOG_FILTER.PLAYBACK ? setShowPlayback(true) : setShowPlayback(false);
  }, []);

  return (
    <div className={`${style.infoLoggerContainer} ${collapsed? '' : style.expanded}`}>
      <CollapseBar title='Log' isCollapsed={collapsed} onClick={() => setCollapsed((prev) => !prev)} />
      {!collapsed && (
        <>
          <div className={style.buttonBar}>
            <Button
              variant={showUser ? 'ontime-filled' : 'ontime-subtle'}
              size='xs'
              onClick={() => setShowUser((s) => !s)}
              onAuxClick={() => disableOthers(LOG_FILTER.USER)}
              onContextMenu={(e) => e.preventDefault()}
            >
              USER
            </Button>
            <Button
              variant={showClient ? 'ontime-filled' : 'ontime-subtle'}
              size='xs'
              onClick={() => setShowClient((s) => !s)}
              onAuxClick={() => disableOthers(LOG_FILTER.CLIENT)}
              onContextMenu={(e) => e.preventDefault()}
            >
              CLIENT
            </Button>
            <Button
              variant={showServer ? 'ontime-filled' : 'ontime-subtle'}
              size='xs'
              onClick={() => setShowServer((s) => !s)}
              onAuxClick={() => disableOthers(LOG_FILTER.SERVER)}
              onContextMenu={(e) => e.preventDefault()}
            >
              SERVER
            </Button>
            <Button
              variant={showPlayback ? 'ontime-filled' : 'ontime-subtle'}
              size='xs'
              onClick={() => setShowPlayback((s) => !s)}
              onAuxClick={() => disableOthers(LOG_FILTER.PLAYBACK)}
              onContextMenu={(e) => e.preventDefault()}
            >
              PLAYBACK
            </Button>
            <Button
              variant={showRx ? 'ontime-filled' : 'ontime-subtle'}
              size='xs'
              onClick={() => setShowRx((s) => !s)}
              onAuxClick={() => disableOthers(LOG_FILTER.RX)}
              onContextMenu={(e) => e.preventDefault()}
            >
              RX
            </Button>
            <Button
              variant={showTx ? 'ontime-filled' : 'ontime-subtle'}
              size='xs'
              onClick={() => setShowTx((s) => !s)}
              onAuxClick={() => disableOthers(LOG_FILTER.TX)}
              onContextMenu={(e) => e.preventDefault()}
            >
              TX
            </Button>
            <Button
              variant='ontime-outlined'
              size='xs'
              onClick={clearLog}
            >
              Clear
            </Button>
          </div>
          <ul className={style.log}>
            {data.map((logEntry) => (
              <li key={logEntry.id} className={`${style.logEntry} ${style[logEntry.level]} `}>
                <span className={style.time}>{logEntry.time}</span>
                <span className={style.origin}>{logEntry.origin}</span>
                <span className={style.msg}>{logEntry.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
