import { useMemo } from 'react';

import { useRundownSelectionContext } from '../context/RundownSelectionContext';
import { useSelectedEventId } from '../hooks/useSocket';
import { getFlatRundownMetadata, getRundownMetadata } from '../utils/rundownMetadata';
import { useFlatRundown, useRundown } from './useRundown';

export function useContextRundownEditModal() {
  'use memo';
  const { effectiveRundownId } = useRundownSelectionContext();
  const { data: rundown } = useRundown(effectiveRundownId);
  return { rundown };
}

export function useContextRundownCueRenumberModal() {
  'use memo';
  const { effectiveRundownId } = useRundownSelectionContext();
  const { data } = useRundown(effectiveRundownId);
  const { flatOrder } = data;
  return { flatOrder };
}

export function useContextRundownList() {
  'use memo';
  const { effectiveRundownId, isLoadedRundown } = useRundownSelectionContext();
  const loadedEventId = useSelectedEventId();
  const effectiveSelectedEventId = isLoadedRundown ? loadedEventId : null;
  const { data: rundown, status } = useRundown(effectiveRundownId);
  const rundownMetadata = useMemo(
    () => getRundownMetadata(rundown, effectiveSelectedEventId),
    [effectiveSelectedEventId, rundown],
  );

  return useMemo(
    () => ({
      rundown,
      rundownMetadata,
      status,
      isLoadedRundown,
    }),
    [rundown, rundownMetadata, status, isLoadedRundown],
  );
}

export function useContextRundownTable() {
  'use memo';
  const { effectiveRundownId, isLoadedRundown } = useRundownSelectionContext();
  const loadedEventId = useSelectedEventId();
  const effectiveSelectedEventId = isLoadedRundown ? loadedEventId : null;
  const { data: rundown, status } = useRundown(effectiveRundownId);
  const flatRundown = useMemo(
    () => getFlatRundownMetadata(rundown, effectiveSelectedEventId),
    [effectiveSelectedEventId, rundown],
  );

  return useMemo(
    () => ({
      flatRundown,
      status,
      loadedEventId,
    }),
    [flatRundown, status, loadedEventId],
  );
}

export function useContextRundownFinder() {
  'use memo';
  const { effectiveRundownId } = useRundownSelectionContext();
  const { data: rundown, status } = useFlatRundown(effectiveRundownId);

  return useMemo(
    () => ({
      rundown,
      rundownId: effectiveRundownId,
      status,
    }),
    [rundown, status, effectiveRundownId],
  );
}
