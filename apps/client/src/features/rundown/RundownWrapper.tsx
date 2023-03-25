import Empty from '../../common/components/state/Empty';
import useRundown from '../../common/hooks-query/useRundown';
import RundownMenu from '../../features/menu/RundownMenu';

import NewRundown from './NewRundown';

import styles from '../editors/Editor.module.scss';

export default function RundownWrapper() {
  const { data, status } = useRundown();

  return (
    <>
      <RundownMenu />
      <div className={styles.content}>
        {status === 'success' && data ? <NewRundown entries={data} /> : <Empty text='Connecting to server' />}
      </div>
    </>
  );
}
