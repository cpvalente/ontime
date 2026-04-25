import { useSessionStorage } from '@mantine/hooks';
import { startTransition, useEffect, useMemo } from 'react';

import { useOrderedProjectList } from '../../common/hooks-query/useProjectList';
import { useProjectRundowns } from '../../common/hooks-query/useProjectRundowns';
import { serverURL } from '../../externals';

export function getCuesheetRundownStorageKey(server: string, projectFilename: string) {
  return `cuesheet-selected-rundown:${server}:${projectFilename || '__loading__'}`;
}

export function resolveSelectedRundownId(
  storedSelectedRundownId: string | null,
  loadedRundownId: string | null,
  availableRundownIds: Set<string>,
) {
  if (storedSelectedRundownId && availableRundownIds.has(storedSelectedRundownId)) {
    return storedSelectedRundownId;
  }

  return loadedRundownId;
}

export function useCuesheetRundownSelection() {
  const {
    data: { lastLoadedProject },
  } = useOrderedProjectList();
  const { data: projectRundowns } = useProjectRundowns();
  const storageKey = useMemo(() => getCuesheetRundownStorageKey(serverURL, lastLoadedProject), [lastLoadedProject]);
  const [storedSelectedRundownId, setStoredSelectedRundownId] = useSessionStorage<string | null>({
    key: storageKey,
    defaultValue: null,
  });

  const availableRundownIds = useMemo(
    () => new Set(projectRundowns.rundowns.map(({ id }) => id)),
    [projectRundowns.rundowns],
  );
  const loadedRundownId = projectRundowns.loaded || null;

  // Sync stale session storage so future page loads start with a valid selection.
  // resolveSelectedRundownId below already computes the correct value for the current render.
  useEffect(() => {
    if (!loadedRundownId) {
      return;
    }

    if (!storedSelectedRundownId || !availableRundownIds.has(storedSelectedRundownId)) {
      setStoredSelectedRundownId(loadedRundownId);
    }
  }, [availableRundownIds, loadedRundownId, setStoredSelectedRundownId, storedSelectedRundownId]);

  const selectedRundownId = resolveSelectedRundownId(storedSelectedRundownId, loadedRundownId, availableRundownIds);

  return {
    loadedRundownId,
    selectedRundownId,
    projectRundowns: projectRundowns.rundowns,
    setSelectedRundownId: (rundownId: string) => {
      startTransition(() => {
        setStoredSelectedRundownId(rundownId);
      });
    },
  };
}
