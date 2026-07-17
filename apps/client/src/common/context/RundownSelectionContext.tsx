import { Maybe, ProjectRundown } from 'ontime-types';
import { PropsWithChildren, createContext, startTransition, useCallback, useContext, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useNavigate } from 'react-router';

import { useProjectRundowns } from '../hooks-query/useProjectRundowns';

export type RundownScopeValue = {
  loadedRundownId: string;
  selectedRundownId: Maybe<string>;
  isLoadedRundown: boolean;
  effectiveRundownId: string;
  selectRundownId: (val: Maybe<string>) => void;
  rundowns: ProjectRundown[];
};

const RundownScopeContext = createContext<RundownScopeValue | null>(null);

export function RundownSelectionContextProvider({ children }: PropsWithChildren) {
  'use memo';
  const { data } = useProjectRundowns();
  const { loaded, rundowns } = data;

  const [selectedRundownId, setSelectedRundownId] = useSelectRundownFromParams();

  const selectRundownId = useCallback(
    (rundownId: Maybe<string>) => {
      startTransition(() => {
        if (rundowns.find((entry) => entry.id === rundownId)) setSelectedRundownId(rundownId);
        else setSelectedRundownId(null);
      });
    },
    [rundowns, setSelectedRundownId],
  );

  const effectiveRundownId = selectedRundownId ? selectedRundownId : loaded;
  const isLoadedRundown = effectiveRundownId === loaded;

  useEffect(() => {
    if (!rundowns.find((entry) => entry.id === effectiveRundownId)) setSelectedRundownId(null);
  }, [rundowns, effectiveRundownId, setSelectedRundownId]);

  const value = useMemo(
    (): RundownScopeValue => ({
      loadedRundownId: loaded,
      isLoadedRundown,
      selectedRundownId,
      effectiveRundownId,
      selectRundownId,
      rundowns,
    }),
    [loaded, isLoadedRundown, selectedRundownId, effectiveRundownId, selectRundownId, rundowns],
  );

  return <RundownScopeContext.Provider value={value}>{children}</RundownScopeContext.Provider>;
}

export function useRundownSelectionContext() {
  const context = useContext(RundownScopeContext);

  if (!context) {
    throw new Error('useRundownScopeSelection requires a RundownSelectionContextProvider');
  }

  return context;
}

const rundownParam = 'rundownId';

export function useSelectRundownFromParams(): [Maybe<string>, (id: Maybe<string>) => void] {
  'use memo';
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedRundownId = searchParams.get(rundownParam);
  const setSelectedRundownId = useCallback(
    (id: Maybe<string>) => {
      if (id === null) {
        setSearchParams((searchParams) => {
          searchParams.delete(rundownParam);
          return searchParams;
        });
      } else {
        setSearchParams((searchParams) => {
          searchParams.set(rundownParam, id);
          return searchParams;
        });
      }
    },
    [setSearchParams],
  );

  return [selectedRundownId, setSelectedRundownId];
}

/**
 *
 * mutates the provided `searchParams`
 */
export function setSelectRundownInParams(id: Maybe<string>, searchParams: URLSearchParams): void {
  if (id === null) {
    searchParams.delete(rundownParam);
  } else {
    searchParams.set(rundownParam, id);
  }
}

export function useDirectLinkToBackgroundEdit() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  return useCallback(
    async (rundownId: string) => {
      setSelectRundownInParams(rundownId, search);
      navigate({
        pathname: '/cuesheet',
        search: search.toString(),
      });
    },
    [navigate, search],
  );
}
