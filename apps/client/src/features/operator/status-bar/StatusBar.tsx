import StatusBarProgress from './StatusBarProgress';
import StatusBarTimers from './StatusBarTimers';

import styles from './StatusBar.module.scss';

export default function StatusBar() {
  return (
    <div className={styles.statusBar}>
      <StatusBarTimers />
      <StatusBarProgress />
    </div>
  );
}
