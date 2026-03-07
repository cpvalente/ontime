import useViewSettings from '../../../common/hooks-query/useViewSettings';
import StatusBarProgress from './StatusBarProgress';
import StatusBarTimers from './StatusBarTimers';

import styles from './StatusBar.module.scss';

export default function StatusBar() {
  const { data } = useViewSettings();

  return (
    <div className={styles.statusBar}>
      <StatusBarTimers />
      {data && <StatusBarProgress viewSettings={data} />}
    </div>
  );
}
