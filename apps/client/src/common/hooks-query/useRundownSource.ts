import { EntryId, Rundown } from 'ontime-types';
import { useMemo } from 'react';

import { useSelectedEventId } from '../hooks/useSocket';
import { getFlatRundownMetadata, type ExtendedEntry } from '../utils/rundownMetadata';
import { useProjectRundowns } from './useProjectRundowns';
import { useRundownById } from './useRundown';

export type RundownSource = {
  targetRundownId: string | null;
  rundown: Rundown;
  flatRundown: ExtendedEntry[];
  status: string;
  selectedEventId: EntryId | null;
};

export function useRundownSource(targetRundownId: string | null): RundownSource {
  const { data: projectRundowns } = useProjectRundowns();
  const loadedRundownId = projectRundowns.loaded || null;
  const resolvedRundownId = targetRundownId ?? loadedRundownId;
  const isLoadedTarget = resolvedRundownId !== null && resolvedRundownId === loadedRundownId;
  const runtimeSelectedEventId = useSelectedEventId();
  const effectiveSelectedEventId = isLoadedTarget ? runtimeSelectedEventId : null;
  const { data: rundown, status } = useRundownById(resolvedRundownId);
  const flatRundown = useMemo(
    () => getFlatRundownMetadata(rundown, effectiveSelectedEventId),
    [effectiveSelectedEventId, rundown],
  );

  return useMemo(
    () => ({
      targetRundownId: resolvedRundownId,
      rundown,
      flatRundown,
      status,
      selectedEventId: effectiveSelectedEventId,
    }),
    [effectiveSelectedEventId, flatRundown, resolvedRundownId, rundown, status],
  );
}
