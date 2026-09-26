import { EntryId, OntimeEntry } from 'ontime-types';

import { useRundownScope } from '../context/RundownScopeContext';
import { useSelectedEventId } from '../hooks/useSocket';
import { useFlatEntries, useFlatRundownMetadata, useRundownById, useRundownMetadata } from './useRundownById';

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
  const rundownMetadata = useRundownMetadata(data, useScopedSelectedEventId());
  return { data, status, rundownMetadata };
}

export function useFlatRundown() {
  const { data, status } = useRundown();
  return { data: useFlatEntries(data), status };
}

export function useFlatRundownWithMetadata() {
  const { data, status } = useRundown();
  return { data: useFlatRundownMetadata(data, useScopedSelectedEventId()), status };
}

export function useEntry(entryId: EntryId | null): OntimeEntry | null {
  const { data: rundown } = useRundown();
  if (entryId === null) return null;
  return rundown.entries[entryId] ?? null;
}
