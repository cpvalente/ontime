import { EntryId, OntimeEntry } from 'ontime-types';
import { useMemo } from 'react';

import { useRundownScope } from '../context/RundownScopeContext';
import { useSelectedEventId } from '../hooks/useSocket';
import { getFlatRundownMetadata, getRundownMetadata } from '../utils/rundownMetadata';
import { flattenRundown, useRundownById } from './useRundownById';

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
  const flatRundown = useMemo(() => flattenRundown(data), [data]);

  return { data: flatRundown, rundownId: data.id, status };
}

export function useFlatRundownWithMetadata() {
  const { data, status } = useRundown();
  const selectedEventId = useScopedSelectedEventId();

  const rundownWithMetadata = useMemo(() => getFlatRundownMetadata(data, selectedEventId), [data, selectedEventId]);
  return { data: rundownWithMetadata, status };
}

/**
 * Hook to get a specific entry by ID from the rundown
 */
export function useEntry(entryId: EntryId | null): OntimeEntry | null {
  const { data: rundown } = useRundown();

  if (entryId === null) return null;
  return rundown.entries[entryId] ?? null;
}
