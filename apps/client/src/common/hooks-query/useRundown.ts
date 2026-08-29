import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EntryId, OntimeEntry, Rundown } from 'ontime-types';
import { useEffect, useMemo } from 'react';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { CURRENT_RUNDOWN_QUERY_KEY, getRundownQueryKey } from '../api/constants';
import { fetchCurrentRundown, fetchRundown } from '../api/rundown';
import { useRundownScope } from '../context/RundownScopeContext';
import { useSelectedEventId } from '../hooks/useSocket';
import { ExtendedEntry, getFlatRundownMetadata, getRundownMetadata } from '../utils/rundownMetadata';

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
    queryKey: isBootstrap ? CURRENT_RUNDOWN_QUERY_KEY : getRundownQueryKey(id),
    queryFn: ({ signal }) => (isBootstrap ? fetchCurrentRundown({ signal }) : fetchRundown(id, { signal })),
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchInterval: queryRefetchIntervalSlow,
  });

  // Seed the id-keyed cache when fetching via the bootstrap alias
  useEffect(() => {
    if (!data || !isBootstrap) return;
    queryClient.setQueryData(getRundownQueryKey(data.id), data);
  }, [data, isBootstrap, queryClient]);

  // Once we have the ID, drop the temporary current cache
  useEffect(() => {
    if (isBootstrap) return;
    queryClient.removeQueries({ queryKey: CURRENT_RUNDOWN_QUERY_KEY, exact: true });
  }, [isBootstrap, queryClient]);

  return { data: data ?? cachedRundownPlaceholder, status, isError, refetch, isFetching };
}

/**
 * Normalised rundown data for the rundown of the enclosing scope
 */
export default function useRundown() {
  const { rundownId } = useRundownScope();
  return useRundownById(rundownId);
}

/**
 * Runtime state only describes the loaded rundown,
 * a scope pointed elsewhere must not show a playing event
 */
export function useScopedSelectedEventId(): EntryId | null {
  const { isLoaded } = useRundownScope();
  const selectedEventId = useSelectedEventId();
  return isLoaded ? selectedEventId : null;
}

export function useRundownWithMetadata() {
  const { data, status } = useRundown();
  const selectedEventId = useScopedSelectedEventId();
  const rundownMetadata = useMemo(() => getRundownMetadata(data, selectedEventId), [data, selectedEventId]);
  return { data, status, rundownMetadata };
}

/**
 * Provides access to a flat rundown
 * built from the order and rundown fields
 */
export function useFlatRundown() {
  const { data, status } = useRundown();

  const flatRundown = useMemo(() => {
    if (data.revision === -1) {
      return [];
    }
    return data.flatOrder.map((id) => data.entries[id]).filter((entry): entry is OntimeEntry => entry !== undefined);
  }, [data]);

  return { data: flatRundown, rundownId: data.id, status };
}

export function useFlatRundownWithMetadata() {
  const { data, status } = useRundown();
  const selectedEventId = useScopedSelectedEventId();

  const rundownWithMetadata = useMemo(() => getFlatRundownMetadata(data, selectedEventId), [data, selectedEventId]);
  return { data: rundownWithMetadata, status };
}

/**
 * Provides access to a partial rundown based on a filter callback
 *
 * Callers MUST memoize the callback with useCallback to prevent
 * re-filtering on every render.
 *
 */
export function usePartialRundown(cb: (event: ExtendedEntry<OntimeEntry>) => boolean) {
  const { data, status } = useFlatRundownWithMetadata();
  const filteredData = useMemo(() => {
    return data.filter(cb);
  }, [data, cb]);

  return { data: filteredData, status };
}

/**
 * Hook to get a specific entry by ID from the rundown
 */
export function useEntry(entryId: EntryId | null): OntimeEntry | null {
  const { data: rundown } = useRundown();

  if (entryId === null) return null;
  return rundown.entries[entryId] ?? null;
}

export function useRundownAuxData() {
  const { data, status } = useRundown();
  const filteredData = useMemo(() => {
    const { title, id } = data;
    return { title, id };
  }, [data]);
  return { data: filteredData, status };
}
