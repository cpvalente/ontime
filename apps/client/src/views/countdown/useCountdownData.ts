import { CustomFields, OntimeEntry, ProjectData, Settings } from 'ontime-types';

import useCustomFields from '../../common/hooks-query/useCustomFields';
import useProjectData from '../../common/hooks-query/useProjectData';
import { useFlatRundownWithMetadata } from '../../common/hooks-query/useRundown';
import useSettings from '../../common/hooks-query/useSettings';
import { useViewOptionsStore } from '../../common/stores/viewOptions';
import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import { ViewData, aggregateQueryStatus } from '../utils/viewLoader.utils';

export interface CountdownData {
  customFields: CustomFields;
  rundownData: ExtendedEntry<OntimeEntry>[];
  projectData: ProjectData;
  isMirrored: boolean;
  settings: Settings;
}

export function useCountdownData(): ViewData<CountdownData> {
  // persisted app state
  const isMirrored = useViewOptionsStore((state) => state.mirror);

  // HTTP API data
  const { data: rundownData, status: rundownStatus } = useFlatRundownWithMetadata();
  const { data: projectData, status: projectDataStatus } = useProjectData();
  const { data: settings, status: settingsStatus } = useSettings();
  const { data: customFields, status: customFieldsStatus } = useCustomFields();

  return {
    data: {
      customFields,
      rundownData,
      projectData,
      isMirrored,
      settings,
    },
    status: aggregateQueryStatus([rundownStatus, projectDataStatus, settingsStatus, customFieldsStatus]),
  };
}
