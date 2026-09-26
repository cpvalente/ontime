import { EntryId, OntimeEntry } from 'ontime-types';
import { useMemo } from 'react';

import { useSelectedEventId } from '../hooks/useSocket';
import { ExtendedEntry } from '../utils/rundownMetadata';
import { useProjectRundowns } from './useProjectRundowns';
import { useFlatEntries, useFlatRundownMetadata, useRundownById, useRundownMetadata } from './useRundownById';

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
  const rundownMetadata = useRundownMetadata(data, useSelectedEventId());
  return { data, status, rundownMetadata };
}

export function useLoadedFlatRundown() {
  const { data, status } = useLoadedRundown();
  return { data: useFlatEntries(data), status };
}

export function useLoadedFlatRundownWithMetadata() {
  const { data, status } = useLoadedRundown();
  return { data: useFlatRundownMetadata(data, useSelectedEventId()), status };
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
 * Runtime ids (the playing event, its group, the next flag) only exist in the loaded rundown
 */
export function useLoadedEntry(entryId: EntryId | null): OntimeEntry | null {
  const { data: rundown } = useLoadedRundown();
  if (entryId === null) return null;
  return rundown.entries[entryId] ?? null;
}

export function useLoadedRundownAuxData() {
  const { data, status } = useLoadedRundown();
  const { title, id } = data;
  const auxData = useMemo(() => ({ title, id }), [title, id]);
  return { data: auxData, status };
}
