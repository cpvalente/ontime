import { Maybe, ProjectRundown } from 'ontime-types';
import {
  PropsWithChildren,
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

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
  const [selectedRundownId, setSelectedRundownId] = useState<Maybe<string>>(null);

  const selectRundownId = useCallback(
    (rundownId: Maybe<string>) => {
      startTransition(() => {
        if (rundowns.find((entry) => entry.id === rundownId)) setSelectedRundownId(rundownId);
        else setSelectedRundownId(null);
      });
    },
    [rundowns],
  );

  const effectiveRundownId = selectedRundownId ? selectedRundownId : loaded;
  const isLoadedRundown = effectiveRundownId === loaded;

  useEffect(() => {
    if (!rundowns.find((entry) => entry.id === effectiveRundownId)) setSelectedRundownId(null);
  }, [rundowns, effectiveRundownId]);

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
