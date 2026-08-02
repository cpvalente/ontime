import { CustomFields, Rundown, Settings } from 'ontime-types';

import useCustomFields from '../../common/hooks-query/useCustomFields';
import { useRundownWithMetadata } from '../../common/hooks-query/useRundown';
import useSettings from '../../common/hooks-query/useSettings';
import { RundownMetadataObject } from '../../common/utils/rundownMetadata';
import { ViewData, aggregateQueryStatus } from '../../views/utils/viewLoader.utils';

export interface OperatorData {
  rundown: Rundown;
  rundownMetadata: RundownMetadataObject;
  customFields: CustomFields;
  settings: Settings;
}

export function useOperatorData(): ViewData<OperatorData> {
  const {
    data: rundown,
    rundownMetadata,
    status: rundownStatus,
    isLoadingError: rundownIsLoadingError,
  } = useRundownWithMetadata();
  const {
    data: customFields,
    status: customFieldStatus,
    isLoadingError: customFieldIsLoadingError,
  } = useCustomFields();
  const { data: settings, status: settingsStatus, isLoadingError: settingsIsLoadingError } = useSettings();

  return {
    data: {
      rundown,
      rundownMetadata,
      customFields,
      settings,
    },
    status: aggregateQueryStatus([
      { status: rundownStatus, isLoadingError: rundownIsLoadingError },
      { status: customFieldStatus, isLoadingError: customFieldIsLoadingError },
      { status: settingsStatus, isLoadingError: settingsIsLoadingError },
    ]),
  };
}
