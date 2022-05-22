import React, { useCallback, useContext, useEffect, useState } from 'react';
import CollapseBar from '../../common/components/collapseBar/CollapseBar';
import { LoggingContext } from '../../app/context/LoggingContext';
import style from './InfoLogger.module.scss';

export default function InfoLogger() {
  const { logData, clearLog } = useContext(LoggingContext);
  const [data, setData] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  // Todo: save in local storage
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

    const matchers = [];
    if (showUser) {
      matchers.push('USER');
    }
    if (showClient) {
      matchers.push('CLIENT');
    }
    if (showServer) {
      matchers.push('SERVER');
    }
    if (showRx) {
      matchers.push('RX');
    }
    if (showTx) {
      matchers.push('TX');
    }
    if (showPlayback) {
      matchers.push('PLAYBACK');
    }

    const d = logData.filter((d) => matchers.some((m) => d.origin === m));

    setData(d);
  }, [logData, showUser, showClient, showServer, showPlayback, showRx, showTx]);

  const disableOthers = useCallback((toEnable) => {
    toEnable === 'USER' ? setShowUser(true) : setShowUser(false);
    toEnable === 'CLIENT' ? setShowClient(true) : setShowClient(false);
    toEnable === 'SERVER' ? setShowServer(true) : setShowServer(false);
    toEnable === 'RX' ? setShowRx(true) : setShowRx(false);
    toEnable === 'TX' ? setShowTx(true) : setShowTx(false);
    toEnable === 'PLAYBACK' ? setShowPlayback(true) : setShowPlayback(false);
  }, []);

  return (
    <div className={collapsed ? style.container : style.container__expanded}>
      <CollapseBar title='Log' isCollapsed={collapsed} onClick={() => setCollapsed((c) => !c)} />
      {!collapsed && (
        <>
          <div className={style.toggleBar}>
            <div
              onClick={() => setShowUser((s) => !s)}
              onAuxClick={() => disableOthers('USER')}
              onContextMenu={(e) => e.preventDefault()}
              className={showUser ? style.active : null}
              role='button'
            >
              USER
            </div>
            <div
              onClick={() => setShowClient((s) => !s)}
              onAuxClick={() => disableOthers('CLIENT')}
              onContextMenu={(e) => e.preventDefault()}
              className={showClient ? style.active : null}
              role='button'
            >
              CLIENT
            </div>
            <div
              onClick={() => setShowServer((s) => !s)}
              onAuxClick={() => disableOthers('SERVER')}
              onContextMenu={(e) => e.preventDefault()}
              className={showServer ? style.active : null}
              role='button'
            >
              SERVER
            </div>
            <div
              onClick={() => setShowPlayback((s) => !s)}
              onAuxClick={() => disableOthers('PLAYBACK')}
              onContextMenu={(e) => e.preventDefault()}
              className={showPlayback ? style.active : null}
              role='button'
            >
              Playback
            </div>
            <div
              onClick={() => setShowRx((s) => !s)}
              onAuxClick={() => disableOthers('RX')}
              onContextMenu={(e) => e.preventDefault()}
              className={showRx ? style.active : null}
              role='button'
            >
              RX
            </div>
            <div
              onClick={() => setShowTx((s) => !s)}
              onAuxClick={() => disableOthers('TX')}
              onContextMenu={(e) => e.preventDefault()}
              className={showTx ? style.active : null}
              role='button'
            >
              TX
            </div>
            <div onClick={clearLog} className={style.clear} role='button'>
              Clear
            </div>
          </div>
          <ul className={style.log}>
            {data.map((d) => (
              <li
                key={d.id}
                className={
                  d.level === 'INFO'
                    ? style.info
                    : d.level === 'WARN'
                      ? style.warn
                      : d.level === 'ERROR'
                        ? style.error
                        : ''
                }
              >
                <div className={style.time}>{d.time}</div>
                <div className={style.origin}>{d.origin}</div>
                <div className={style.msg}>{d.text}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
