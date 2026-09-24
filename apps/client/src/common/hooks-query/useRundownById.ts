import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EntryId, OntimeEntry, Rundown } from 'ontime-types';
import { useMemo } from 'react';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { getRundownCacheKey, getRundownQueryKey } from '../api/constants';
import { fetchCurrentRundown, fetchRundown } from '../api/rundown';
import { getFlatRundownMetadata, getRundownMetadata } from '../utils/rundownMetadata';

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
 * the `/current` alias to keep the first paint to a single round-trip, and seed
 * the id-keyed cache that every reader moves to once the loaded id is known.
 */
export function useRundownById(rundownId: string | null | undefined) {
  const queryClient = useQueryClient();
  const id = rundownId ?? '';

  const { data, status, isError, refetch, isFetching } = useQuery<Rundown>({
    queryKey: getRundownCacheKey(id),
    queryFn: async ({ signal }) => {
      if (id) return fetchRundown(id, { signal });
      const rundown = await fetchCurrentRundown({ signal });
      queryClient.setQueryData(getRundownQueryKey(rundown.id), rundown);
      return rundown;
    },
    refetchInterval: queryRefetchIntervalSlow,
  });

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

type RundownContent = Pick<Rundown, 'entries' | 'flatOrder'>;

/*
 * Derivations below key on entries and flatOrder only,
 * so a change which only moves the revision does not rebuild them.
 */

export function useFlatEntries({ entries, flatOrder }: RundownContent) {
  return useMemo(() => flattenRundown({ entries, flatOrder }), [entries, flatOrder]);
}

export function useRundownMetadata({ entries, flatOrder }: RundownContent, selectedEventId: EntryId | null) {
  return useMemo(
    () => getRundownMetadata({ entries, flatOrder }, selectedEventId),
    [entries, flatOrder, selectedEventId],
  );
}

export function useFlatRundownMetadata({ entries, flatOrder }: RundownContent, selectedEventId: EntryId | null) {
  return useMemo(
    () => getFlatRundownMetadata({ entries, flatOrder }, selectedEventId),
    [entries, flatOrder, selectedEventId],
  );
}
