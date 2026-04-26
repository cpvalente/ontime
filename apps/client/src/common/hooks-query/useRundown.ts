import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EntryId, OntimeEntry, Rundown } from 'ontime-types';
import { useEffect, useMemo } from 'react';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { CURRENT_RUNDOWN_QUERY_KEY, getRundownQueryKey } from '../api/constants';
import { fetchCurrentRundown } from '../api/rundown';
import { useSelectedEventId } from '../hooks/useSocket';
import { ExtendedEntry, getFlatRundownMetadata, getRundownMetadata } from '../utils/rundownMetadata';
import { useProjectRundowns } from './useProjectRundowns';

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
 * Normalised rundown data
 */
export default function useRundown() {
  const queryClient = useQueryClient();
  const {
    data: { loaded: loadedRundownId },
  } = useProjectRundowns();

  const { data, status, isError, refetch, isFetching } = useQuery<Rundown>({
    queryKey: loadedRundownId ? getRundownQueryKey(loadedRundownId) : CURRENT_RUNDOWN_QUERY_KEY,
    queryFn: ({ signal }) => fetchCurrentRundown({ signal }),
    refetchInterval: queryRefetchIntervalSlow,
  });

  // Seed the ID-based cache when fetching via the 'current' alias (bootstrap)
  useEffect(() => {
    if (!data || loadedRundownId) return;
    queryClient.setQueryData(getRundownQueryKey(data.id), data);
  }, [data, loadedRundownId, queryClient]);

  // Once we have the ID, drop the temporary current cache
  useEffect(() => {
    if (!loadedRundownId) return;
    queryClient.removeQueries({ queryKey: CURRENT_RUNDOWN_QUERY_KEY, exact: true });
  }, [loadedRundownId, queryClient]);

  return { data: data ?? cachedRundownPlaceholder, status, isError, refetch, isFetching };
}

export function useRundownWithMetadata() {
  const { data, status } = useRundown();
  const selectedEventId = useSelectedEventId();
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
  const selectedEventId = useSelectedEventId();

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
