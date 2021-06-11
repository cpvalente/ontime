import { Icon } from '@chakra-ui/react';
import { FiChevronUp } from 'react-icons/fi';
import style from './Info.module.css';

export default function InfoLogger(props) {
  const { logData } = props;
  return (
    <div className={style.container}>
      <div className={style.header}>
        Log
        <Icon
          className={style.moreCollapsed}
          as={FiChevronUp}
          marginTop='-0.5em'
          // onClick={() => props.setCollapsed(true)}
        />
      </div>
      <ul className={style.log}>
        <li className={style.info}>10:35:23 [PLAYBACK] Next</li>
        <li className={style.client}>
          10:32:10 [CLIENT] New Socket client (Total now 3)
        </li>
        <li className={style.info}>10:28:23 [PLAYBACK] Next</li>
        <li className={style.info}>10:25:23 [PLAYBACK] Play</li>
        <li className={style.info}>10:23:13 [SERVER] Server Reconnected</li>
        <li className={style.error}>10:23:10 [SERVER] Server Disconnected</li>
      </ul>
    </div>
  );
}
