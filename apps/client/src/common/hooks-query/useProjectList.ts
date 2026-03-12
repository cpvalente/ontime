import { useQuery } from '@tanstack/react-query';
import { ProjectFile, ProjectFileList, ProjectFileListResponse } from 'ontime-types';
import { useMemo } from 'react';

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
    queryFn: ({ signal }) => getProjects({ signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchInterval: queryRefetchIntervalSlow,
  });
  return { data: data ?? placeholderProjectList, status, refetch };
}

export type ProjectSortMode = 'alphabetical-asc' | 'alphabetical-desc' | 'modified-asc' | 'modified-desc';
type SortComparator = (a: ProjectFile, b: ProjectFile) => number;
const sortComparators: Record<ProjectSortMode, SortComparator> = {
  'alphabetical-asc': (a, b) => a.filename.localeCompare(b.filename),
  'alphabetical-desc': (a, b) => b.filename.localeCompare(a.filename),
  'modified-asc': (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
  'modified-desc': (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
};

export function useOrderedProjectList(sort: ProjectSortMode = 'modified-desc') {
  const response = useProjectList();
  const { files, lastLoadedProject } = response.data;

  const reorderedProjectFiles: ProjectFileList = useMemo(() => {
    if (!files.length) return [];

    const sorted = [...files].sort(sortComparators[sort]);

    // keep loaded always on top
    const currentlyLoadedIndex = sorted.findIndex((project) => project.filename === lastLoadedProject);
    if (currentlyLoadedIndex > 0) {
      const [loaded] = sorted.splice(currentlyLoadedIndex, 1);
      sorted.unshift(loaded);
    }

    return sorted;
  }, [files, lastLoadedProject, sort]);

  return { ...response, data: { reorderedProjectFiles, lastLoadedProject: response.data.lastLoadedProject } };
}
