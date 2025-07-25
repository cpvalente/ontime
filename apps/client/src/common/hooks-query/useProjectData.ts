import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { PROJECT_DATA } from '../api/constants';
import { getProjectData, postProjectData } from '../api/project';
import { projectDataPlaceholder } from '../models/ProjectData';

export default function useProjectData() {
  const { data, status, isFetching, isError, refetch } = useQuery({
    queryKey: PROJECT_DATA,
    queryFn: getProjectData,
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchInterval: queryRefetchIntervalSlow,
  });

  return { data: data ?? projectDataPlaceholder, status, isFetching, isError, refetch };
}

export function useUpdateProjectData() {
  const queryClient = useQueryClient();

  const updateFn = useMutation({
    mutationFn: postProjectData,
    onSuccess: (newProjectData) => {
      queryClient.setQueryData(PROJECT_DATA, newProjectData);
    },
  });

  return {
    updateProjectData: updateFn.mutateAsync,
    isMutating: updateFn.isPending,
    isMutatingError: updateFn.isError,
  };
}
