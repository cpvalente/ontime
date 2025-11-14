import type { CustomFields, ProjectData, Settings, ViewSettings } from 'ontime-types';

import useCustomFields from '../../../common/hooks-query/useCustomFields';
import useProjectData from '../../../common/hooks-query/useProjectData';
import useSettings from '../../../common/hooks-query/useSettings';
import useViewSettings from '../../../common/hooks-query/useViewSettings';
import { aggregateQueryStatus } from '../../utils/viewLoader.utils';

export interface PipTimerData {
  customFields: CustomFields;
  projectData: ProjectData;
  settings: Settings;
  viewSettings: ViewSettings;
}

export function usePipTimerData() {
  // HTTP API data
  const { data: projectData, status: projectDataStatus } = useProjectData();
  const { data: viewSettings, status: viewSettingsStatus } = useViewSettings();
  const { data: settings, status: settingsStatus } = useSettings();
  const { data: customFields, status: customFieldsStatus } = useCustomFields();

  return {
    data: {
      customFields,
      projectData,
      settings,
      viewSettings,
    },
    status: aggregateQueryStatus([projectDataStatus, viewSettingsStatus, settingsStatus, customFieldsStatus]),
  };
}
