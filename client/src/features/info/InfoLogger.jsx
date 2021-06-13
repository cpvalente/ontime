import { Icon } from '@chakra-ui/react';
import { useState } from 'react';
import { FiChevronUp } from 'react-icons/fi';
import style from './Info.module.css';

export default function InfoLogger(props) {
  const [collapsed, setCollapsed] = useState(false);

  const { logData } = props;

  return (
    <div className={style.container}>
      <div className={style.header}>
        Log
        <Icon
          className={collapsed ? style.moreCollapsed : style.moreExpanded}
          as={FiChevronUp}
          onClick={() => setCollapsed((c) => !c)}
        />
      </div>
      {!collapsed && (
        <ul className={style.log}>
          <li className={style.info}>10:35:23 [PLAYBACK] Next</li>
          <li className={style.client}>
            10:32:10 [CLIENT] New socket client (total: 3)
          </li>
          <li className={style.info}>10:28:23 [PLAYBACK] Next</li>
          <li className={style.info}>10:25:23 [PLAYBACK] Play</li>
          <li className={style.info}>10:23:13 [SERVER] Server Reconnected</li>
          <li className={style.error}>10:23:10 [SERVER] Server Disconnected</li>
        </ul>
      )}
    </div>
  );
}
