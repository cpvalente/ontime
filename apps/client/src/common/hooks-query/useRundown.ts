import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EntryId, OntimeEntry, Rundown } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { RUNDOWN } from '../api/constants';
import { fetchCurrentRundown } from '../api/rundown';
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
 * Normalised rundown data
 */
export default function useRundown() {
  const { data, status, isError, refetch, isFetching } = useQuery<Rundown>({
    queryKey: RUNDOWN,
    queryFn: fetchCurrentRundown,
    refetchInterval: queryRefetchIntervalSlow,
  });

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
