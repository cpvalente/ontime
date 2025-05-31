import { useQuery } from '@tanstack/react-query';
import { RefetchKey } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { getProjectData } from '../api/project';
import { projectDataPlaceholder } from '../models/ProjectData';

export default function useProjectData() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: [RefetchKey.PROJECT_DATA],
    queryFn: getProjectData,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return { data: data ?? projectDataPlaceholder, status, isFetching, isError, refetch };
}
