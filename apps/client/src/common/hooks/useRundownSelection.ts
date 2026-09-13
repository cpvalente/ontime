import { useSessionStorage } from '@mantine/hooks';
import { startTransition, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';

import { serverURL } from '../../externals';
import { useOrderedProjectList } from '../hooks-query/useProjectList';
import { useProjectRundowns } from '../hooks-query/useProjectRundowns';

export const FOLLOW_LOADED_RUNDOWN_ID = '__follow-loaded__' as const;

/** each surface keeps its own selection, so panels can point at different rundowns */
export type RundownSelectionNamespace = 'cuesheet';

export function getRundownSelectionStorageKey(
  namespace: RundownSelectionNamespace,
  server: string,
  projectFilename: string,
) {
  return `rundown-selection:${namespace}:${server}:${projectFilename}`;
}

export function resolveSelectedRundownId(storedSelectedRundownId: string | null, availableRundownIds: Set<string>) {
  if (storedSelectedRundownId && availableRundownIds.has(storedSelectedRundownId)) return storedSelectedRundownId;
  return FOLLOW_LOADED_RUNDOWN_ID;
}

/**
 * Persisted choice of which rundown a surface operates on.
 * The resolved id is meant to be handed to a rundown scope provider,
 * where null means follow whichever rundown is loaded.
 */
export function useRundownSelection(namespace: RundownSelectionNamespace) {
  'use memo';

  const { data: projectRundowns } = useProjectRundowns();
  const {
    data: { lastLoadedProject },
  } = useOrderedProjectList();
  const storageKey = useMemo(
    () => getRundownSelectionStorageKey(namespace, serverURL, lastLoadedProject),
    [namespace, lastLoadedProject],
  );
  const [storedSelectedRundownId, setStoredSelectedRundownId] = useSessionStorage<string | null>({
    key: storageKey,
    defaultValue: FOLLOW_LOADED_RUNDOWN_ID,
  });

  const availableRundownIds = new Set(projectRundowns.rundowns.map(({ id }) => id)).add(FOLLOW_LOADED_RUNDOWN_ID);
  const { loaded: loadedRundownId } = projectRundowns;

  const selectedRundownId = resolveSelectedRundownId(storedSelectedRundownId, availableRundownIds);

  return {
    loadedRundownId,
    selectedRundownId,
    /** id for the rundown scope, null follows the loaded rundown */
    scopedRundownId: selectedRundownId === FOLLOW_LOADED_RUNDOWN_ID ? null : selectedRundownId,
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
  const storageKey = getRundownSelectionStorageKey('cuesheet', serverURL, lastLoadedProject);
  const [_, setStoredSelectedRundownId] = useSessionStorage<string | null>({ key: storageKey, defaultValue: null });

  return useCallback(
    async (rundownId: string) => {
      await navigate('/cuesheet');
      startTransition(() => setStoredSelectedRundownId(rundownId));
    },
    [setStoredSelectedRundownId, navigate],
  );
}
