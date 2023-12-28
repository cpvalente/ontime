import { useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { PROJECT_LIST } from '../api/apiConstants';
import { getProjects } from '../api/ontimeApi';

export function useProjectList() {
  const { data, status } = useQuery({
    queryKey: PROJECT_LIST,
    queryFn: getProjects,
    placeholderData: [],
    retry: 5,
    retryDelay: (attempt: number) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });
  return { data: data ?? [], status };
}
