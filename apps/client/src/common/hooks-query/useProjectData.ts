import { useQuery } from '@tanstack/react-query';
import { RefetchKey } from 'ontime-types';

import { getProjectData } from '../api/project';
import { projectDataPlaceholder } from '../models/ProjectData';

export default function useProjectData() {
  const { data, status, isFetching, isError } = useQuery({
    queryKey: [RefetchKey.PROJECT_DATA],
    queryFn: getProjectData,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    networkMode: 'always',
  });

  return { data: data ?? projectDataPlaceholder, status, isFetching, isError };
}
