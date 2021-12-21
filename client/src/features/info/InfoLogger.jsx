import { useState } from 'react';
import style from './InfoLogger.module.scss';
import CollapseBar from "../../common/components/collapseBar/CollapseBar";

export default function InfoLogger(props) {
  const [collapsed, setCollapsed] = useState(false);
  // Todo: save in local storage
  const [showClient, setShowClient] = useState(true);
  const [showServer, setShowServer] = useState(true);
  const [showPlayback, setShowPlayback] = useState(true);
  const [showRx, setShowRx] = useState(true);
  const [showTx, setShowTx] = useState(true);

  const { logData } = props;

  const data = [
    {
      time: '10:32:12',
      level: 'error',
      origin: 'SERVER',
      msg: 'New socket client (total: 3)'
    },
    {
      time: '10:32:10',
      level: 'info',
      origin: 'PLAYBACK',
      msg: 'Play'
    },
    {
      time: '10:31:10',
      level: 'error',
      origin: 'PLAYBACK',
      msg: 'Next'
    },
    {
      time: '10:31:10',
      level: 'warn',
      origin: 'SERVER',
      msg: 'Server disconnected'
    }
  ];

  return (
    <div className={style.container}>
      <CollapseBar title={'Log'} isCollapsed={collapsed} onClick={() => setCollapsed((c) => !c)}/>
      {!collapsed && (
        <>
          <div className={style.toggleBar}>
            <div
              onClick={() => setShowClient((s) => !s)}
              className={showClient && style.active}>
              CLIENT
            </div>
            <div
              onClick={() => setShowServer((s) => !s)}
              className={showServer && style.active}>
              SERVER
            </div>
            <div
              onClick={() => setShowPlayback((s) => !s)}
              className={showPlayback && style.active}>
              PLAYBACK
            </div>
            <div
              onClick={() => setShowRx((s) => !s)}
              className={showRx && style.active}>
              RX
            </div>
            <div
              onClick={() => setShowTx((s) => !s)}
              className={showTx && style.active}>
              TX
            </div>
          </div>
            <ul className={style.log}>
              {data.map((d) => (
                <li key={`${d.time}-${d.msg}`} className={d.level === 'info' ? style.info : d.level === 'warn' ? style.warn : d.level === 'error' ? style.error : ''}>
                  <div
                    className={style.time}
                  >{d.time}</div>
                  <div className={style.origin}>{d.origin}</div>
                  <div className={style.msg}>{d.msg}</div>
                </li>
              ))}
            </ul>
        </>
      )}
    </div>
  );
}
