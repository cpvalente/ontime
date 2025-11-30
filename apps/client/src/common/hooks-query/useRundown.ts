import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EntryId, OntimeEntry, Rundown } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { RUNDOWN } from '../api/constants';
import { fetchCurrentRundown } from '../api/rundown';
import { useSelectedEventId } from '../hooks/useSocket';
import { ExtendedEntry, getFlatRundownMetadata, getRundownMetadata } from '../utils/rundownMetadata';

import useProjectData from './useProjectData';

// revision is -1 so that the remote revision is higher
const cachedRundownPlaceholder: Rundown = {
  id: 'default',
  title: '',
  order: [],
  flatOrder: [],
  entries: {},
  revision: -1,
};

/**
 * Normalised rundown data
 */
export default function useRundown() {
  const { data, status, isError, refetch, isFetching } = useQuery<Rundown>({
    queryKey: RUNDOWN,
    queryFn: fetchCurrentRundown,
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchInterval: queryRefetchIntervalSlow,
  });
  return { data: data ?? cachedRundownPlaceholder, status, isError, refetch, isFetching };
}

export function useRundownWithMetadata() {
  const { data, status } = useRundown();
  const { selectedEventId } = useSelectedEventId();
  const rundownMetadata = useMemo(() => getRundownMetadata(data, selectedEventId), [data, selectedEventId]);
  return { data, status, rundownMetadata };
}

/**
 * Provides access to a flat rundown
 * built from the order and rundown fields
 */
export function useFlatRundown() {
  const { data, status } = useRundown();
  const { data: projectData } = useProjectData();

  const loadedProject = useRef<string>('');
  const [prevRevision, setPrevRevision] = useState<number>(-1);
  const [flatRundown, setFlatRundown] = useState<OntimeEntry[]>([]);

  // update data whenever the revision changes
  useEffect(() => {
    if (data.revision !== -1 || data.revision !== prevRevision) {
      const flatRundown = (data.flatOrder ?? []).map((id) => data.entries[id]);
      setFlatRundown(flatRundown);
      setPrevRevision(data.revision);
    }
  }, [data.entries, data.flatOrder, data.revision, prevRevision]);

  // TODO: should we have a project id field?
  // TODO(v4): cleanup as part of load multiple rundowns
  // invalidate current version if project changes
  useEffect(() => {
    if (projectData?.title !== loadedProject.current) {
      setPrevRevision(-1);
      loadedProject.current = projectData?.title ?? '';
    }
  }, [projectData]);

  return { data: flatRundown, rundownId: data.id, status };
}

export function useFlatRundownWithMetadata() {
  const { data, status } = useRundown();
  const { selectedEventId } = useSelectedEventId();

  const rundownWithMetadata = useMemo(() => getFlatRundownMetadata(data, selectedEventId), [data, selectedEventId]);
  return { data: rundownWithMetadata, status };
}

/**
 * Provides access to a partial rundown based on a filter callback
 */
export function usePartialRundown(cb: (event: ExtendedEntry<OntimeEntry>) => boolean) {
  const { data, status } = useFlatRundownWithMetadata();
  const filteredData = useMemo(() => {
    return data.filter(cb);
  }, [data, cb]);

  return { data: filteredData, status };
}

/**
 * Hook to get a specific entry by ID from the rundown
 */
export function useEntry(entryId: EntryId | null): OntimeEntry | null {
  const { data: rundown } = useRundown();

  // track the specific entry we care about
  const entry = useMemo(() => {
    if (entryId === null) return null;
    return rundown.entries[entryId];
  }, [entryId, rundown.entries]);

  return entry;
}
