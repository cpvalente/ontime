import { CustomFields, Rundown, Settings } from 'ontime-types';

import useCustomFields from '../../common/hooks-query/useCustomFields';
import { useRundownWithMetadata } from '../../common/hooks-query/useRundown';
import useSettings from '../../common/hooks-query/useSettings';
import { RundownMetadataObject } from '../../common/utils/rundownMetadata';
import { aggregateQueryStatus, ViewData } from '../../views/utils/viewLoader.utils';

export interface OperatorData {
  rundown: Rundown;
  rundownMetadata: RundownMetadataObject;
  customFields: CustomFields;
  settings: Settings;
}

export function useOperatorData(): ViewData<OperatorData> {
  const { data: rundown, rundownMetadata, status: rundownStatus } = useRundownWithMetadata();
  const { data: customFields, status: customFieldStatus } = useCustomFields();
  const { data: settings, status: settingsStatus } = useSettings();

  return {
    data: {
      rundown,
      rundownMetadata,
      customFields,
      settings,
    },
    status: aggregateQueryStatus([rundownStatus, customFieldStatus, settingsStatus]),
  };
}
