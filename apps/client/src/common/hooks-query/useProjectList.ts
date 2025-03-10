import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProjectFileListResponse } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { PROJECT_LIST } from '../api/constants';
import { getProjects } from '../api/db';

const placeholderProjectList: ProjectFileListResponse = {
  files: [],
  lastLoadedProject: '',
};

function useProjectList() {
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

export function useOrderedProjectList() {
  const response = useProjectList();
  const { files, lastLoadedProject } = response.data;

  const reorderedProjectFiles = useMemo(() => {
    if (!files.length) return [];

    const currentlyLoadedIndex = files.findIndex((project) => project.filename === lastLoadedProject);

    if (currentlyLoadedIndex === -1) return files;

    const projectFiles = [...files];
    const current = projectFiles.splice(currentlyLoadedIndex, 1)[0];

    return [current, ...projectFiles];
  }, [files, lastLoadedProject]);

  return { ...response, data: { reorderedProjectFiles, lastLoadedProject: response.data.lastLoadedProject } };
}
