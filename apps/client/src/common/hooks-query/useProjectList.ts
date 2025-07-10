import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProjectFileListResponse } from 'ontime-types';

import { PROJECT_LIST } from '../api/constants';
import { getProjects } from '../api/db';

const initialData: ProjectFileListResponse = {
  files: [],
  lastLoadedProject: '',
};

function useProjectList() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: PROJECT_LIST,
    queryFn: getProjects,
    placeholderData: (previousData) => previousData,
    initialData,
  });
  return { data, isLoading, refetch };
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
