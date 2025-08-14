import Empty from '../../common/components/state/Empty';
import { useRundownWithMetadata } from '../../common/hooks-query/useRundown';

import RundownHeader from './rundown-header/RundownHeader';
import RundownHeaderMobile from './rundown-header/RundownHeaderMobile';
import Rundown from './Rundown';

import styles from './Rundown.module.scss';

interface RundownWrapperProps {
  isSmallDevice?: boolean;
}

export default function RundownWrapper({ isSmallDevice }: RundownWrapperProps) {
  const { data, status,rundownMetadata } = useRundownWithMetadata();

  return (
    <div className={styles.rundownWrapper}>
      {isSmallDevice ? <RundownHeaderMobile /> : <RundownHeader />}
      {status === 'success' && data ? <Rundown data={data} rundownMetadata={rundownMetadata}/> : <Empty text='Connecting to server' />}
    </div>
  );
}
