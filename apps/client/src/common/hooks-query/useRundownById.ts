import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OntimeEntry, Rundown } from 'ontime-types';
import { useEffect, useRef } from 'react';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { CURRENT_RUNDOWN_QUERY_KEY, getRundownCacheKey, getRundownQueryKey } from '../api/constants';
import { fetchCurrentRundown, fetchRundown } from '../api/rundown';

// revision is -1 so that the remote revision is higher
const cachedRundownPlaceholder: Rundown = {
  id: 'default',
  title: '',
  order: [],
  flatOrder: [],
  entries: {},
  revision: -1,
};

/**
 * Provides access to a specific rundown by ID.
 *
 * Without an ID we do not yet know which rundown is loaded, so we bootstrap via
 * the `/current` alias to keep the first paint to a single round-trip, then seed
 * the id-keyed cache that every other reader shares.
 */
export function useRundownById(rundownId: string | null | undefined) {
  const queryClient = useQueryClient();
  const id = rundownId ?? '';
  const isBootstrap = id === '';

  const { data, status, isError, refetch, isFetching } = useQuery<Rundown>({
    queryKey: getRundownCacheKey(id),
    queryFn: ({ signal }) => (isBootstrap ? fetchCurrentRundown({ signal }) : fetchRundown(id, { signal })),
    refetchInterval: queryRefetchIntervalSlow,
  });

  // Seed the id-keyed cache when fetching via the bootstrap alias
  useEffect(() => {
    if (!data || !isBootstrap) return;
    queryClient.setQueryData(getRundownQueryKey(data.id), data);
  }, [data, isBootstrap, queryClient]);

  // Once we have the ID, drop the temporary current cache.
  // Only the reader which bootstrapped may do so, others are still relying on it.
  const didBootstrap = useRef(isBootstrap);
  useEffect(() => {
    if (isBootstrap || !didBootstrap.current) return;
    didBootstrap.current = false;
    queryClient.removeQueries({ queryKey: CURRENT_RUNDOWN_QUERY_KEY, exact: true });
  }, [isBootstrap, queryClient]);

  return { data: data ?? cachedRundownPlaceholder, status, isError, refetch, isFetching };
}

/**
 * Builds a flat rundown from the order and entries fields.
 * An empty rundown has an empty order, so a placeholder flattens to nothing
 * without having to read the revision, which an optimistic update also owns.
 */
export function flattenRundown(rundown: Pick<Rundown, 'entries' | 'flatOrder'>): OntimeEntry[] {
  return rundown.flatOrder
    .map((id) => rundown.entries[id])
    .filter((entry): entry is OntimeEntry => entry !== undefined);
}
