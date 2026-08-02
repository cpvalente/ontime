import { CustomFields, ProjectData, Settings, ViewSettings } from 'ontime-types';

import useCustomFields from '../../common/hooks-query/useCustomFields';
import useProjectData from '../../common/hooks-query/useProjectData';
import useSettings from '../../common/hooks-query/useSettings';
import useViewSettings from '../../common/hooks-query/useViewSettings';
import { useViewOptionsStore } from '../../common/stores/viewOptions';
import { ViewData, aggregateQueryStatus } from '../utils/viewLoader.utils';

export interface StudioData {
  customFields: CustomFields;
  projectData: ProjectData;
  isMirrored: boolean;
  settings: Settings;
  viewSettings: ViewSettings;
}

export function useStudioData(): ViewData<StudioData> {
  // persisted app state
  const isMirrored = useViewOptionsStore((state) => state.mirror);

  // HTTP API data
  const { data: projectData, status: projectDataStatus, isLoadingError: projectDataIsLoadingError } = useProjectData();
  const {
    data: viewSettings,
    status: viewSettingsStatus,
    isLoadingError: viewSettingsIsLoadingError,
  } = useViewSettings();
  const { data: settings, status: settingsStatus, isLoadingError: settingsIsLoadingError } = useSettings();
  const {
    data: customFields,
    status: customFieldsStatus,
    isLoadingError: customFieldsIsLoadingError,
  } = useCustomFields();

  return {
    data: {
      customFields,
      projectData,
      isMirrored,
      settings,
      viewSettings,
    },
    status: aggregateQueryStatus([
      { status: projectDataStatus, isLoadingError: projectDataIsLoadingError },
      { status: viewSettingsStatus, isLoadingError: viewSettingsIsLoadingError },
      { status: settingsStatus, isLoadingError: settingsIsLoadingError },
      { status: customFieldsStatus, isLoadingError: customFieldsIsLoadingError },
    ]),
  };
}
