import { CustomFields, OntimeEntry, ProjectData, Settings } from 'ontime-types';

import useCustomFields from '../../common/hooks-query/useCustomFields';
import useProjectData from '../../common/hooks-query/useProjectData';
import { useFlatRundown } from '../../common/hooks-query/useRundown';
import useSettings from '../../common/hooks-query/useSettings';
import { useViewOptionsStore } from '../../common/stores/viewOptions';
import { aggregateQueryStatus, ViewData } from '../utils/viewLoader.utils';

export interface BackstageData {
  events: OntimeEntry[];
  customFields: CustomFields;
  projectData: ProjectData;
  isMirrored: boolean;
  settings: Settings;
}

export function useBackstageData(): ViewData<BackstageData> {
  // persisted app state
  const isMirrored = useViewOptionsStore((state) => state.mirror);

  // HTTP API data
  const { data: rundownData, status: rundownStatus } = useFlatRundown();
  const { data: projectData, status: projectDataStatus } = useProjectData();
  const { data: settings, status: settingsStatus } = useSettings();
  const { data: customFields, status: customFieldsStatus } = useCustomFields();

  return {
    data: {
      events: rundownData,
      customFields,
      projectData,
      isMirrored,
      settings,
    },
    status: aggregateQueryStatus([rundownStatus, projectDataStatus, settingsStatus, customFieldsStatus]),
  };
}
