import { ProjectData, Settings, ViewSettings } from 'ontime-types';

import useProjectData from '../../common/hooks-query/useProjectData';
import useSettings from '../../common/hooks-query/useSettings';
import useViewSettings from '../../common/hooks-query/useViewSettings';
import { useViewOptionsStore } from '../../common/stores/viewOptions';
import { aggregateQueryStatus, ViewData } from '../utils/viewLoader.utils';

export interface StudioData {
  projectData: ProjectData;
  isMirrored: boolean;
  settings: Settings;
  viewSettings: ViewSettings;
}

export function useStudioData(): ViewData<StudioData> {
  // persisted app state
  const isMirrored = useViewOptionsStore((state) => state.mirror);

  // HTTP API data
  const { data: projectData, status: projectDataStatus } = useProjectData();
  const { data: viewSettings, status: viewSettingsStatus } = useViewSettings();
  const { data: settings, status: settingsStatus } = useSettings();

  return {
    data: {
      projectData,
      isMirrored,
      settings,
      viewSettings,
    },
    status: aggregateQueryStatus([projectDataStatus, viewSettingsStatus, settingsStatus]),
  };
}
