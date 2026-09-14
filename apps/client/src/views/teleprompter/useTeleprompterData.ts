import type { CustomFields, Rundown } from 'ontime-types';

import useCustomFields from '../../common/hooks-query/useCustomFields';
import { useRundownWithMetadata } from '../../common/hooks-query/useRundown';
import type { RundownMetadataObject } from '../../common/utils/rundownMetadata';
import { type ViewData, aggregateQueryStatus } from '../utils/viewLoader.utils';

export interface TeleprompterData {
  rundown: Rundown;
  rundownMetadata: RundownMetadataObject;
  customFields: CustomFields;
}

export function useTeleprompterData(): ViewData<TeleprompterData> {
  const { data: rundown, rundownMetadata, status: rundownStatus } = useRundownWithMetadata();
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
