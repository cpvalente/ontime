import Empty from '../../common/components/state/Empty';
import { useRundownWithMetadata } from '../../common/hooks-query/useRundown';
import EditorEditModal from '../../views/cuesheet/cuesheet-edit-modal/EditorEditModal';

import RundownHeader from './rundown-header/RundownHeader';
import RundownHeaderMobile from './rundown-header/RundownHeaderMobile';
import RundownTable from './rundown-table/RundownTable';
import Rundown from './Rundown';

import styles from './Rundown.module.scss';

export type RundownViewMode = 'list' | 'table';

interface RundownWrapperProps {
  isSmallDevice?: boolean;
  viewMode: RundownViewMode;
  setViewMode: (mode: RundownViewMode) => void;
}

export default function RundownWrapper({ isSmallDevice, viewMode, setViewMode }: RundownWrapperProps) {
  const { data, status, rundownMetadata } = useRundownWithMetadata();

  const isLoading = status !== 'success' || !data || !rundownMetadata;

  return (
    <div className={styles.rundownWrapper}>
      {isSmallDevice ? <RundownHeaderMobile /> : <RundownHeader viewMode={viewMode} setViewMode={setViewMode} />}
      {isLoading && <Empty text='Connecting to server' />}
      {!isLoading && viewMode === 'list' && <Rundown data={data} rundownMetadata={rundownMetadata} />}
      {!isLoading && viewMode === 'table' && <RundownTable />}
      <EditorEditModal />
    </div>
  );
}
