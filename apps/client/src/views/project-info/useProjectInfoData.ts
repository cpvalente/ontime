import { ProjectData } from 'ontime-types';

import useProjectData from '../../common/hooks-query/useProjectData';
import { useViewOptionsStore } from '../../common/stores/viewOptions';
import { ViewData, aggregateQueryStatus } from '../utils/viewLoader.utils';

export interface ProjectInfoData {
  projectData: ProjectData;
  isMirrored: boolean;
}

export function useProjectInfoData(): ViewData<ProjectInfoData> {
  // persisted app state
  const isMirrored = useViewOptionsStore((state) => state.mirror);

  // HTTP API data
  const { data: projectData, status: projectDataStatus, isLoadingError: projectDataIsLoadingError } = useProjectData();

  return {
    data: {
      projectData,
      isMirrored,
    },
    status: aggregateQueryStatus([{ status: projectDataStatus, isLoadingError: projectDataIsLoadingError }]),
  };
}
