import { useSessionStorage } from '@mantine/hooks';
import { startTransition, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';

import { useOrderedProjectList } from '../../common/hooks-query/useProjectList';
import { useProjectRundowns } from '../../common/hooks-query/useProjectRundowns';
import { serverURL } from '../../externals';

export const FOLLOW_LOADED_RUNDOWN_ID = '__follow-loaded__' as const;

export function getCuesheetRundownStorageKey(server: string, projectFilename: string) {
  return `cuesheet-selected-rundown:${server}:${projectFilename}`;
}

export function resolveSelectedRundownId(
  storedSelectedRundownId: string | null,
  loadedRundownId: string | null,
  availableRundownIds: Set<string>,
) {
  if (storedSelectedRundownId && availableRundownIds.has(storedSelectedRundownId)) return storedSelectedRundownId;
  return loadedRundownId;
}

export function useCuesheetRundownSelection() {
  'use memo';

  const { data: projectRundowns } = useProjectRundowns();
  const {
    data: { lastLoadedProject },
  } = useOrderedProjectList();
  const storageKey = useMemo(() => getCuesheetRundownStorageKey(serverURL, lastLoadedProject), [lastLoadedProject]);
  const [storedSelectedRundownId, setStoredSelectedRundownId] = useSessionStorage<string | null>({
    key: storageKey,
    defaultValue: null,
  });

  const availableRundownIds = new Set(projectRundowns.rundowns.map(({ id }) => id)).add(FOLLOW_LOADED_RUNDOWN_ID);
  const { loaded: loadedRundownId } = projectRundowns;

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

export function useDirectLinkToBackgroundEdit() {
  const {
    data: { lastLoadedProject },
  } = useOrderedProjectList();
  const navigate = useNavigate();
  const storageKey = getCuesheetRundownStorageKey(serverURL, lastLoadedProject);
  const [_, setStoredSelectedRundownId] = useSessionStorage<string | null>({ key: storageKey, defaultValue: null });

  return useCallback(
    async (rundownId: string) => {
      await navigate('/cuesheet');
      startTransition(() => setStoredSelectedRundownId(rundownId));
    },
    [setStoredSelectedRundownId, navigate],
  );
}
