import Empty from '../../common/components/state/Empty';
import useRundown, { useReport } from '../../common/hooks-query/useRundown';

import RundownHeader from './rundown-header/RundownHeader';
import Rundown from './Rundown';

import styles from './Rundown.module.scss';

export default function RundownWrapper() {
  const { data, status } = useRundown();
  const { data: report } = useReport();

  return (
    <div className={styles.rundownWrapper}>
      <RundownHeader />
      {status === 'success' && data ? <Rundown data={data} report={report} /> : <Empty text='Connecting to server' />}
    </div>
  );
}
