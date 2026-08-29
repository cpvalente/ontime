import { EntryId, OntimeEntry } from 'ontime-types';
import { useMemo } from 'react';

import { useSelectedEventId } from '../hooks/useSocket';
import { ExtendedEntry, getFlatRundownMetadata, getRundownMetadata } from '../utils/rundownMetadata';
import { useProjectRundowns } from './useProjectRundowns';
import { flattenRundown, useRundownById } from './useRundownById';

/**
 * Rundown data for surfaces which only ever work against the rundown being played:
 * the viewers, the operator, app settings and the runtime overview.
 *
 * These take no part in a rundown scope, they resolve the loaded rundown directly.
 * Anything which can be pointed at a background rundown reads from its scope instead.
 */
export function useLoadedRundown() {
  const {
    data: { loaded },
  } = useProjectRundowns();
  return useRundownById(loaded);
}

export function useLoadedRundownWithMetadata() {
  const { data, status } = useLoadedRundown();
  const selectedEventId = useSelectedEventId();
  const rundownMetadata = useMemo(() => getRundownMetadata(data, selectedEventId), [data, selectedEventId]);
  return { data, status, rundownMetadata };
}

export function useLoadedFlatRundown() {
  const { data, status } = useLoadedRundown();
  const flatRundown = useMemo(() => flattenRundown(data), [data]);
  return { data: flatRundown, rundownId: data.id, status };
}

export function useLoadedFlatRundownWithMetadata() {
  const { data, status } = useLoadedRundown();
  const selectedEventId = useSelectedEventId();
  const rundownWithMetadata = useMemo(() => getFlatRundownMetadata(data, selectedEventId), [data, selectedEventId]);
  return { data: rundownWithMetadata, status };
}

/**
 * Provides access to a partial rundown based on a filter callback
 *
 * Callers MUST memoize the callback with useCallback to prevent
 * re-filtering on every render.
 */
export function useLoadedPartialRundown(cb: (event: ExtendedEntry<OntimeEntry>) => boolean) {
  const { data, status } = useLoadedFlatRundownWithMetadata();
  const filteredData = useMemo(() => data.filter(cb), [data, cb]);
  return { data: filteredData, status };
}

/**
 * Hook to get a specific entry by ID from the loaded rundown.
 * Runtime ids (the playing event, its group, the next flag) only exist here.
 */
export function useLoadedEntry(entryId: EntryId | null): OntimeEntry | null {
  const { data: rundown } = useLoadedRundown();

  if (entryId === null) return null;
  return rundown.entries[entryId] ?? null;
}

export function useLoadedRundownAuxData() {
  const { data, status } = useLoadedRundown();
  const filteredData = useMemo(() => {
    const { title, id } = data;
    return { title, id };
  }, [data]);
  return { data: filteredData, status };
}
