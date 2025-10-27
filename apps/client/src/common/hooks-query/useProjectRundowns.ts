import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProjectRundownsList } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { PROJECT_RUNDOWNS } from '../api/constants';
import { createRundown, deleteRundown, duplicateRundown, fetchProjectRundownList, loadRundown, renameRundown } from '../api/rundown';

/**
 * Project rundowns
 */
export function useProjectRundowns() {
  const { data, status, isError, refetch, isFetching } = useQuery<ProjectRundownsList>({
    queryKey: PROJECT_RUNDOWNS,
    queryFn: fetchProjectRundownList,
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchInterval: queryRefetchIntervalSlow,
  });
  return { data: data ?? { loaded: '', rundowns: [] }, status, isError, refetch, isFetching };
}

export function useMutateProjectRundowns() {
  const ontimeQueryClient = useQueryClient();

  const { mutateAsync: create } = useMutation({
    mutationFn: createRundown,
    onMutate: () => {
      ontimeQueryClient.cancelQueries({ queryKey: PROJECT_RUNDOWNS });
    },
    onSuccess: (response) => {
      ontimeQueryClient.setQueryData(PROJECT_RUNDOWNS, response.data);
    },
  });
  
  const { mutateAsync: duplicate } = useMutation({
    mutationFn: duplicateRundown,
    onMutate: () => {
      ontimeQueryClient.cancelQueries({ queryKey: PROJECT_RUNDOWNS });
    },
    onSuccess: (response) => {
      ontimeQueryClient.setQueryData(PROJECT_RUNDOWNS, response.data);
    },
  });
  
  const { mutateAsync: rename } = useMutation({
    mutationFn: ([rundownId, title]: Parameters<typeof renameRundown>) => renameRundown(rundownId, title),
    onMutate: () => {
      ontimeQueryClient.cancelQueries({ queryKey: PROJECT_RUNDOWNS });
    },
    onSuccess: (response) => {
      ontimeQueryClient.setQueryData(PROJECT_RUNDOWNS, response.data);
    },
  });

  const { mutateAsync: remove } = useMutation({
    mutationFn: deleteRundown,
    onMutate: () => {
      ontimeQueryClient.cancelQueries({ queryKey: PROJECT_RUNDOWNS });
    },
    onSuccess: (response) => {
      ontimeQueryClient.setQueryData(PROJECT_RUNDOWNS, response.data);
    },
  });

  const { mutateAsync: load } = useMutation({
    mutationFn: loadRundown,
    onMutate: () => {
      ontimeQueryClient.cancelQueries({ queryKey: PROJECT_RUNDOWNS });
    },
    onSuccess: (response) => {
      ontimeQueryClient.setQueryData(PROJECT_RUNDOWNS, response.data);
    },
  });

  return { create, duplicate, remove, load, rename };
}
