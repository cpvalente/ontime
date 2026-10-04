import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProjectRundownsList } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { PROJECT_RUNDOWNS } from '../api/constants';
import {
  createRundown,
  deleteRundown,
  duplicateRundown,
  fetchProjectRundownList,
  loadRundown,
  renameRundown,
} from '../api/rundown';

//TODO: make suspends so we don't have to deal with no value all over
/**
 * Project rundowns
 */
export function useProjectRundowns() {
  const query = useQuery<ProjectRundownsList>({
    queryKey: PROJECT_RUNDOWNS,
    queryFn: ({ signal }) => fetchProjectRundownList({ signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchInterval: queryRefetchIntervalSlow,
  });
  // Scope providers only need the data; fetching flags should not invalidate their subtrees.
  return {
    data: query.data ?? { loaded: '', rundowns: [] },
    status: query.status,
    refetch: query.refetch,
    get isError() {
      return query.isError;
    },
    get isFetching() {
      return query.isFetching;
    },
  };
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
