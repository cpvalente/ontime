import { CustomField, CustomFieldKey, CustomFields, Rundown, Settings } from 'ontime-types';

import useCustomFields from '../../common/hooks-query/useCustomFields';
import { useLoadedRundownWithMetadata } from '../../common/hooks-query/useLoadedRundown';
import useSettings from '../../common/hooks-query/useSettings';
import { RundownMetadataObject } from '../../common/utils/rundownMetadata';
import { ViewData, aggregateQueryStatus } from '../../views/utils/viewLoader.utils';

export interface OperatorData {
  rundown: Rundown;
  rundownMetadata: RundownMetadataObject;
  customFields: CustomFields;
  customFieldsByKey: ReadonlyMap<CustomFieldKey, CustomField>;
  settings: Settings;
}

export function useOperatorData(): ViewData<OperatorData> {
  const { data: rundown, rundownMetadata, status: rundownStatus } = useLoadedRundownWithMetadata();
  const { data: customFields, fieldsByKey: customFieldsByKey, status: customFieldStatus } = useCustomFields();
  const { data: settings, status: settingsStatus } = useSettings();

  return {
    data: {
      rundown,
      rundownMetadata,
      customFields,
      customFieldsByKey,
      settings,
    },
    status: aggregateQueryStatus([rundownStatus, customFieldStatus, settingsStatus]),
  };
}
