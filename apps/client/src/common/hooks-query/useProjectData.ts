import { useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { PROJECT_DATA } from '../api/apiConstants';
import { getProjectData } from '../api/projectDataApi';
import { projectDataPlaceholder } from '../models/ProjectData';

export default function useProjectData() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: PROJECT_DATA,
    queryFn: getProjectData,
    placeholderData: projectDataPlaceholder,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return { data, status, isFetching, isError, refetch };
}
