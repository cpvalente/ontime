import { memo } from 'react';

import Empty from '../../common/components/state/Empty';
import { useRundownWithMetadata } from '../../common/hooks-query/useRundown';
import { useRundownEditor } from '../../common/hooks/useSocket';
import Rundown from './Rundown';

export default memo(RundownList);
function RundownList() {
  const { data, status, rundownMetadata } = useRundownWithMetadata();
  const featureData = useRundownEditor();

  const isLoading = status !== 'success' || !data || !rundownMetadata;

  if (isLoading) {
    return <Empty text='Connecting to server' />;
  }

  return (
    <Rundown
      order={data.order}
      flatOrder={data.flatOrder}
      entries={data.entries}
      id={data.id}
      rundownMetadata={rundownMetadata}
      featureData={featureData}
    />
  );
}
