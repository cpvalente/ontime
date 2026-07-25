import { memo } from 'react';

import EmptyFill from '../../common/components/state/EmptyFill';
import { useRundownWithMetadata } from '../../common/hooks-query/useRundown';
import { useRundownEditor } from '../../common/hooks/useSocket';
import { useTranslation } from '../../translation/TranslationProvider';
import Rundown from './Rundown';

export default memo(RundownList);
function RundownList() {
  const { data, status, rundownMetadata } = useRundownWithMetadata();
  const featureData = useRundownEditor();
  const { getLocalizedString } = useTranslation();

  // avoid showing the editable empty state before we know whether the rundown is actually empty
  if (status === 'pending') {
    return <EmptyFill text='Loading…' />;
  }

  if (status === 'error') {
    return <EmptyFill text={getLocalizedString('common.no_data')} />;
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
