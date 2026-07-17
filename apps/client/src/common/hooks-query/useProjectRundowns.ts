import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { ProjectRundownsList } from 'ontime-types';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { PROJECT_RUNDOWNS } from '../api/constants';
import {
  createRundown,
  deleteRundown,
  duplicateRundown,
  fetchProjectRundownList,
  loadRundown,
  renameRundown,
} from '../api/rundown';
import { ontimeQueryClient } from '../queryClient';

/**
 * Project rundowns
 */
export function useProjectRundowns() {
  const { data, status, isError, refetch, isFetching } = useSuspenseQuery<ProjectRundownsList>({
    queryKey: PROJECT_RUNDOWNS,
    queryFn: ({ signal }) => fetchProjectRundownList({ signal }),
    staleTime: MILLIS_PER_HOUR,
  });
  return { data, status, isError, refetch, isFetching };
}

export function useMutateProjectRundowns() {
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
