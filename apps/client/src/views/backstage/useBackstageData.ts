import { CustomFields, OntimeEntry, ProjectData, Settings } from 'ontime-types';

import useCustomFields from '../../common/hooks-query/useCustomFields';
import useProjectData from '../../common/hooks-query/useProjectData';
import { useFlatRundown } from '../../common/hooks-query/useRundown';
import useSettings from '../../common/hooks-query/useSettings';
import { useViewOptionsStore } from '../../common/stores/viewOptions';
import { ViewData, aggregateQueryStatus } from '../utils/viewLoader.utils';

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
  const { data: rundownData, status: rundownStatus, isLoadingError: rundownIsLoadingError } = useFlatRundown();
  const { data: projectData, status: projectDataStatus, isLoadingError: projectDataIsLoadingError } = useProjectData();
  const { data: settings, status: settingsStatus, isLoadingError: settingsIsLoadingError } = useSettings();
  const {
    data: customFields,
    status: customFieldsStatus,
    isLoadingError: customFieldsIsLoadingError,
  } = useCustomFields();

  return {
    data: {
      events: rundownData,
      customFields,
      projectData,
      isMirrored,
      settings,
    },
    status: aggregateQueryStatus([
      { status: rundownStatus, isLoadingError: rundownIsLoadingError },
      { status: projectDataStatus, isLoadingError: projectDataIsLoadingError },
      { status: settingsStatus, isLoadingError: settingsIsLoadingError },
      { status: customFieldsStatus, isLoadingError: customFieldsIsLoadingError },
    ]),
  };
}
