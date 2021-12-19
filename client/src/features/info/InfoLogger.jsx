import { useState } from 'react';
import style from './Info.module.scss';
import CollapseBar from "../../common/components/collapseBar/CollapseBar";

export default function InfoLogger(props) {
  const [collapsed, setCollapsed] = useState(false);

  const { logData } = props;

  const data = [
    {
      time: '10:32:12',
      type: 'info',
      origin: 'SERVER',
      msg: 'New socket client (total: 3)'
    },
    {
      time: '10:32:10',
      type: 'info',
      origin: 'PLAYBACK',
      msg: 'Play'
    },
    {
      time: '10:31:10',
      type: 'info',
      origin: 'PLAYBACK',
      msg: 'Next'
    },
    {
      time: '10:31:10',
      type: 'info',
      origin: 'SERVER',
      msg: 'Server Disconnected'
    }
  ];

  return (
    <div className={style.container}>
      <CollapseBar title={'Log'} isCollapsed={collapsed} onClick={() => setCollapsed((c) => !c)}/>
      {!collapsed && (
        <>
          <div className={style.toggleBar}>
            <div className={style.client}>CLIENT</div>
            <div className={style.server}>SERVER</div>
            <div className={style.integrations}>PLAYBACK</div>
            <div className={style.integrations}>INTEGRATIONS</div>
          </div>
          <table className={style.log}>
            {data.map((d) => (
              <tr>
                <td>{d.time}</td>
                <td>{d.origin}</td>
                <td>{d.msg}</td>
              </tr>
            ))}
          </table>
        </>
      )}
    </div>
  );
}
