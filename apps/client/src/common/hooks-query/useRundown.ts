import { useQuery } from '@tanstack/react-query';
import { EntryId, Maybe, OntimeEntry, Rundown } from 'ontime-types';
import { useMemo } from 'react';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { getRundownQueryKey } from '../api/constants';
import { fetchRundown } from '../api/rundown';
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
 * Provides access to a specific rundown by ID.
 * When rundownId is not provided the loaded rundown is provided
 */
export function useRundown(rundownId: Maybe<string>) {
  'use memo';

  const {
    data: { loaded: loadedRundownId },
  } = useProjectRundowns();

  const effectiveRundownId = rundownId ? rundownId : loadedRundownId;
  const isLoadedRundown = rundownId === loadedRundownId;

  const { data, status, isError, refetch, isFetching } = useQuery<Rundown>({
    queryKey: getRundownQueryKey(effectiveRundownId),
    queryFn: ({ signal }) => fetchRundown(effectiveRundownId, { signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchInterval: queryRefetchIntervalSlow,
  });

  return { data: data ?? cachedRundownPlaceholder, status, isError, refetch, isFetching, isLoadedRundown };
}

/**
 * @deprecated
 */
export function useRundownWithMetadata(rundownId: Maybe<string>) {
  'use memo';

  const { data, status, isLoadedRundown } = useRundown(rundownId);
  const selectedEventId = useSelectedEventId();
  const effectiveSelectedEventId = isLoadedRundown ? selectedEventId : null;
  const rundownMetadata = getRundownMetadata(data, effectiveSelectedEventId);
  return { data, status, rundownMetadata };
}

/**
 * Provides access to a flat rundown
 * built from the order and rundown fields
 */
export function useFlatRundown(rundownId: Maybe<string>) {
  const { data, status } = useRundown(rundownId);

  const flatRundown = useMemo(() => {
    if (data.revision === -1) {
      return [];
    }
    return data.flatOrder.map((id) => data.entries[id]).filter((entry): entry is OntimeEntry => entry !== undefined);
  }, [data]);

  return { data: flatRundown, rundownId: data.id, status };
}

export function useFlatRundownWithMetadata(rundownId: Maybe<string>) {
  'use memo';

  const { data, status, isLoadedRundown } = useRundown(rundownId);
  const selectedEventId = useSelectedEventId();
  const effectiveSelectedEventId = isLoadedRundown ? selectedEventId : null;
  const rundownWithMetadata = getFlatRundownMetadata(data, effectiveSelectedEventId);
  return { data: rundownWithMetadata, status };
}

/**
 * Provides access to a partial rundown based on a filter callback
 *
 * Callers MUST memoize the callback with useCallback to prevent
 * re-filtering on every render.
 *
 */
export function usePartialRundown(rundownId: Maybe<string>, cb: (event: ExtendedEntry<OntimeEntry>) => boolean) {
  const { data, status } = useFlatRundownWithMetadata(rundownId);
  const filteredData = useMemo(() => {
    return data.filter(cb);
  }, [data, cb]);

  return { data: filteredData, status };
}

/**
 * Hook to get a specific entry by ID from the rundown
 * @deprecated
 */
export function useEntry(rundownId: Maybe<string>, entryId: EntryId | null): OntimeEntry | null {
  const { data: rundown } = useRundown(rundownId);

  if (entryId === null) return null;
  return rundown.entries[entryId] ?? null;
}

export function useRundownAuxData(rundownId: Maybe<string>) {
  const { data, status } = useRundown(rundownId);
  const filteredData = useMemo(() => {
    const { title, id } = data;
    return { title, id };
  }, [data]);
  return { data: filteredData, status };
}
