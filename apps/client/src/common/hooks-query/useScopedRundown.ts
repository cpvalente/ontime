import { EntryId, Rundown } from 'ontime-types';
import { useMemo } from 'react';

import { useSelectedEventId } from '../hooks/useSocket';
import { getFlatRundownMetadata, type ExtendedEntry } from '../utils/rundownMetadata';
import { useProjectRundowns } from './useProjectRundowns';
import { useRundownById } from './useRundown';

export type RundownSource = {
  rundownId: string | null;
  rundown: Rundown;
  flatRundown: ExtendedEntry[];
  status: string;
  selectedEventId: EntryId | null;
};

/**
 * Explicitly scoped rundown data for views that may operate on a non-loaded rundown.
 */
export function useScopedRundown(rundownId: string | null): RundownSource {
  const { data: projectRundowns } = useProjectRundowns();
  return useRundownSource(rundownId, projectRundowns.loaded || null);
}

/**
 * Loaded-rundown source for views that must follow the active runtime rundown.
 */
export function useLoadedRundownSource(): RundownSource {
  const { data: projectRundowns } = useProjectRundowns();
  const loadedRundownId = projectRundowns.loaded || null;
  return useRundownSource(loadedRundownId, loadedRundownId);
}

function useRundownSource(rundownId: string | null, loadedRundownId: string | null): RundownSource {
  const isLoadedTarget = rundownId !== null && rundownId === loadedRundownId;
  const runtimeSelectedEventId = useSelectedEventId();
  const effectiveSelectedEventId = isLoadedTarget ? runtimeSelectedEventId : null;
  const { data: rundown, status } = useRundownById(rundownId);
  const flatRundown = useMemo(
    () => getFlatRundownMetadata(rundown, effectiveSelectedEventId),
    [effectiveSelectedEventId, rundown],
  );

  return useMemo(
    () => ({
      rundownId,
      rundown,
      flatRundown,
      status,
      selectedEventId: effectiveSelectedEventId,
    }),
    [effectiveSelectedEventId, flatRundown, rundown, rundownId, status],
  );
}
