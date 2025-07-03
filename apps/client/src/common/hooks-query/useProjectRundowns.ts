import { useQuery } from '@tanstack/react-query';
import { ProjectRundownsList } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { PROJECT_RUNDOWNS } from '../api/constants';
import { fetchProjectRundownList } from '../api/rundown';

/**
 * Project rundowns
 */
export function useProjectRundowns() {
  const { data, status, isError, refetch, isFetching } = useQuery<ProjectRundownsList>({
    queryKey: PROJECT_RUNDOWNS,
    queryFn: fetchProjectRundownList,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });
  return { data: data ?? { loaded: '', rundowns: [] }, status, isError, refetch, isFetching };
}
