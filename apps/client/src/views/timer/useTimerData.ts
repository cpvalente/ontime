import { CustomFields, ProjectData, RundownEntries, Settings, ViewSettings } from 'ontime-types';

import useCustomFields from '../../common/hooks-query/useCustomFields';
import useProjectData from '../../common/hooks-query/useProjectData';
import useRundown from '../../common/hooks-query/useRundown';
import useSettings from '../../common/hooks-query/useSettings';
import useViewSettings from '../../common/hooks-query/useViewSettings';
import { useViewOptionsStore } from '../../common/stores/viewOptions';
import { ViewData, aggregateQueryStatus } from '../utils/viewLoader.utils';

export interface TimerData {
  customFields: CustomFields;
  projectData: ProjectData;
  isMirrored: boolean;
  settings: Settings;
  viewSettings: ViewSettings;
  entries: RundownEntries;
}

export function useTimerData(): ViewData<TimerData> {
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
  const { data: rundown, status: rundownStatus, isLoadingError: rundownIsLoadingError } = useRundown();
  const { entries } = rundown;

  return {
    data: {
      customFields,
      projectData,
      isMirrored,
      settings,
      viewSettings,
      entries,
    },
    status: aggregateQueryStatus([
      { status: projectDataStatus, isLoadingError: projectDataIsLoadingError },
      { status: viewSettingsStatus, isLoadingError: viewSettingsIsLoadingError },
      { status: settingsStatus, isLoadingError: settingsIsLoadingError },
      { status: customFieldsStatus, isLoadingError: customFieldsIsLoadingError },
      { status: rundownStatus, isLoadingError: rundownIsLoadingError },
    ]),
  };
}
