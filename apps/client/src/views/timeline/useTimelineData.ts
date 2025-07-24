import { OntimeEntry, ProjectData, Settings } from 'ontime-types';

import useProjectData from '../../common/hooks-query/useProjectData';
import { useFlatRundown } from '../../common/hooks-query/useRundown';
import useSettings from '../../common/hooks-query/useSettings';
import { aggregateQueryStatus, ViewData } from '../utils/viewLoader.utils';

export interface TimelineData {
  events: OntimeEntry[];
  projectData: ProjectData;
  settings: Settings;
}

export function useTimelineData(): ViewData<TimelineData> {
  // HTTP API data
  const { data: rundownData, status: rundownStatus } = useFlatRundown();
  const { data: projectData, status: projectDataStatus } = useProjectData();
  const { data: settings, status: settingsStatus } = useSettings();

  return {
    data: {
      events: rundownData,
      projectData,
      settings,
    },
    status: aggregateQueryStatus([rundownStatus, projectDataStatus, settingsStatus]),
  };
}
