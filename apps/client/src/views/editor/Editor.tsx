import { lazy } from 'react';

import styles from './Editor.module.scss';

const Rundown = lazy(() => import('../../features/rundown/RundownExport'));
const TimerControl = lazy(() => import('../../features/control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('../../features/control/message/MessageControlExport'));

export default function Editor() {
  return (
    <div id='panels' className={styles.panelContainer}>
      <div className={styles.left}>
        <TimerControl />
        <MessageControl />
      </div>
      <Rundown />
    </div>
  );
}
