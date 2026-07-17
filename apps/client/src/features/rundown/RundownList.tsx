import { Playback } from 'ontime-types';
import { memo } from 'react';

import Empty from '../../common/components/state/Empty';
import { useContextRundownList } from '../../common/hooks-query/useContextRundown';
import { useRundownEditor } from '../../common/hooks/useSocket';
import Rundown from './Rundown';

const backgroundFeatureData = {
  playback: Playback.Stop,
  selectedEventId: null,
  nextEventId: null,
};

export default memo(RundownList);
function RundownList() {
  const { rundown, status, rundownMetadata, isLoadedRundown } = useContextRundownList();
  const featureData = useRundownEditor();

  const isLoading = status !== 'success' || !rundown || !rundownMetadata;

  if (isLoading) {
    return <Empty text='Connecting to server' />;
  }

  return (
    <Rundown
      order={rundown.order}
      flatOrder={rundown.flatOrder}
      entries={rundown.entries}
      id={rundown.id}
      rundownMetadata={rundownMetadata}
      featureData={isLoadedRundown ? featureData : backgroundFeatureData}
    />
  );
}
