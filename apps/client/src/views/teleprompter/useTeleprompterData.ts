import type { CustomFields, Rundown } from 'ontime-types';

import useCustomFields from '../../common/hooks-query/useCustomFields';
import { useLoadedRundownWithMetadata } from '../../common/hooks-query/useLoadedRundown';
import type { RundownMetadataObject } from '../../common/utils/rundownMetadata';
import { type ViewData, aggregateQueryStatus } from '../utils/viewLoader.utils';

export interface TeleprompterData {
  rundown: Rundown;
  rundownMetadata: RundownMetadataObject;
  customFields: CustomFields;
}

export function useTeleprompterData(): ViewData<TeleprompterData> {
  const { data: rundown, rundownMetadata, status: rundownStatus } = useLoadedRundownWithMetadata();
  const { data: customFields, status: customFieldStatus } = useCustomFields();

  return {
    data: {
      rundown,
      rundownMetadata,
      customFields,
    },
    status: aggregateQueryStatus([rundownStatus, customFieldStatus]),
  };
}
