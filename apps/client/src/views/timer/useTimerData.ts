import { CustomFields, ProjectData, RundownEntries, Settings } from 'ontime-types';

import useCustomFields from '../../common/hooks-query/useCustomFields';
import { useLoadedRundown } from '../../common/hooks-query/useLoadedRundown';
import useProjectData from '../../common/hooks-query/useProjectData';
import useSettings from '../../common/hooks-query/useSettings';
import { useViewOptionsStore } from '../../common/stores/viewOptions';
import { ViewData, aggregateQueryStatus } from '../utils/viewLoader.utils';

export interface TimerData {
  customFields: CustomFields;
  projectData: ProjectData;
  isMirrored: boolean;
  settings: Settings;
  entries: RundownEntries;
}

export function useTimerData(): ViewData<TimerData> {
  // persisted app state
  const isMirrored = useViewOptionsStore((state) => state.mirror);

  // HTTP API data
  const { data: projectData, status: projectDataStatus } = useProjectData();
  const { data: settings, status: settingsStatus } = useSettings();
  const { data: customFields, status: customFieldsStatus } = useCustomFields();
  const { data: rundown, status: rundownStatus } = useLoadedRundown();
  const { entries } = rundown;

  return {
    data: {
      customFields,
      projectData,
      isMirrored,
      settings,
      entries,
    },
    status: aggregateQueryStatus([projectDataStatus, settingsStatus, customFieldsStatus, rundownStatus]),
  };
}
