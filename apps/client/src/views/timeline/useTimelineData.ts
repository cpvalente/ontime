import { CustomFields, OntimeEntry, ProjectData, Settings } from 'ontime-types';

import useCustomFields from '../../common/hooks-query/useCustomFields';
import useProjectData from '../../common/hooks-query/useProjectData';
import { useFlatRundownWithMetadata } from '../../common/hooks-query/useRundown';
import useSettings from '../../common/hooks-query/useSettings';
import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import { ViewData, aggregateQueryStatus } from '../utils/viewLoader.utils';

export interface TimelineData {
  events: ExtendedEntry<OntimeEntry>[];
  customFields: CustomFields;
  projectData: ProjectData;
  settings: Settings;
}

export function useTimelineData(): ViewData<TimelineData> {
  // HTTP API data
  const {
    data: rundownData,
    status: rundownStatus,
    isLoadingError: rundownIsLoadingError,
  } = useFlatRundownWithMetadata();
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
