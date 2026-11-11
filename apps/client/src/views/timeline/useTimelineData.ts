import { OrderedCustomFields, OntimeEntry, ProjectData, Settings } from 'ontime-types';

import useCustomFields from '../../common/hooks-query/useCustomFields';
import { useLoadedFlatRundownWithMetadata } from '../../common/hooks-query/useLoadedRundown';
import useProjectData from '../../common/hooks-query/useProjectData';
import useSettings from '../../common/hooks-query/useSettings';
import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import { ViewData, aggregateQueryStatus } from '../utils/viewLoader.utils';

export interface TimelineData {
  events: ExtendedEntry<OntimeEntry>[];
  orderedFields: OrderedCustomFields;
  projectData: ProjectData;
  settings: Settings;
}

export function useTimelineData(): ViewData<TimelineData> {
  // HTTP API data
  const { data: rundownData, status: rundownStatus } = useLoadedFlatRundownWithMetadata();
  const { data: projectData, status: projectDataStatus } = useProjectData();
  const { data: settings, status: settingsStatus } = useSettings();
  const { orderedFields, status: customFieldsStatus } = useCustomFields();

  return {
    data: {
      events: rundownData,
      orderedFields,
      projectData,
      settings,
    },
    status: aggregateQueryStatus([rundownStatus, projectDataStatus, settingsStatus, customFieldsStatus]),
  };
}
