import Empty from '../../common/components/state/Empty';
import useRundown from '../../common/hooks-query/useRundown';
import RundownMenu from '../menu/RundownMenu';

import Rundown from './Rundown';

import styles from './Rundown.module.scss';

export default function RundownWrapper() {
  const { data, status } = useRundown();

  return (
    <div>
      <RundownMenu />
      <div className={styles.rundownWrapper}>
        {status === 'success' && data ? <Rundown entries={data} /> : <Empty text='Connecting to server' />}
      </div>
    </div>
  );
}
