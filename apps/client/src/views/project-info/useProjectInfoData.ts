import { ProjectData } from 'ontime-types';

import useProjectData from '../../common/hooks-query/useProjectData';
import { useViewOptionsStore } from '../../common/stores/viewOptions';
import { ViewData } from '../utils/viewLoader.utils';

export interface ProjectInfoData {
  projectData: ProjectData;
  isMirrored: boolean;
}

export function useProjectInfoData(): ViewData<ProjectInfoData> {
  // persisted app state
  const isMirrored = useViewOptionsStore((state) => state.mirror);

  // HTTP API data
  const { data: projectData, status: projectDataStatus } = useProjectData();

  return {
    data: {
      projectData,
      isMirrored,
    },
    status: projectDataStatus,
  };
}
