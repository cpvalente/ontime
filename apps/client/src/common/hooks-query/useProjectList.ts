import { useQuery } from '@tanstack/react-query';
import { ProjectFileListResponse } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { PROJECT_LIST } from '../api/apiConstants';
import { getProjects } from '../api/ontimeApi';

const placeholderProjectList: ProjectFileListResponse = {
  files: [],
  lastLoadedProject: '',
};

export function useProjectList() {
  const { data, status } = useQuery({
    queryKey: PROJECT_LIST,
    queryFn: getProjects,
    placeholderData: placeholderProjectList,
    retry: 5,
    retryDelay: (attempt: number) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });
  return { data: data ?? placeholderProjectList, status };
}
