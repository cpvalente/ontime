import Empty from '../../common/components/state/Empty';
import useRundown from '../../common/hooks-query/useRundown';

import RundownHeader from './rundown-header/RundownHeader';
import Rundown from './Rundown';

import styles from './Rundown.module.scss';
import ErrorBoundary from '../../common/components/error-boundary/ErrorBoundary';

export default function RundownWrapper() {
  const { data, status } = useRundown();

  return (
    <div className={styles.rundownWrapper}>
      <ErrorBoundary>
        <RundownHeader />
      </ErrorBoundary>
      <ErrorBoundary>
        {status === 'success' && data ? <Rundown data={data} /> : <Empty text='Connecting to server' />}
      </ErrorBoundary>
    </div>
  );
}
