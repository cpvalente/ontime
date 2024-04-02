import { useQuery } from '@tanstack/react-query';
import { ProjectFileListResponse } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { PROJECT_LIST } from '../api/constants';
import { getProjects } from '../api/db';

const placeholderProjectList: ProjectFileListResponse = {
  files: [],
  lastLoadedProject: '',
};

export function useProjectList() {
  const { data, status, refetch } = useQuery({
    queryKey: PROJECT_LIST,
    queryFn: getProjects,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt: number) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });
  return { data: data ?? placeholderProjectList, status, refetch };
}
