import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NormalisedRundown, OntimeRundown, OntimeRundownEntry, RundownCached } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { RUNDOWN } from '../api/constants';
import { fetchNormalisedRundown } from '../api/rundown';

import useProjectData from './useProjectData';

// revision is -1 so that the remote revision is higher
const cachedRundownPlaceholder = { order: [] as string[], rundown: {} as NormalisedRundown, revision: -1 };

/**
 * Normalised rundown data
 */
export default function useRundown() {
  const { data, status, isError, refetch, isFetching } = useQuery<RundownCached>({
    queryKey: RUNDOWN,
    queryFn: fetchNormalisedRundown,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });
  return { data: data ?? cachedRundownPlaceholder, status, isError, refetch, isFetching };
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
  const [flatRunDown, setFlatRunDown] = useState<OntimeRundown>([]);

  // update data whenever the revision changes
  useEffect(() => {
    if (data.revision !== -1 && data.revision !== prevRevision) {
      const flatRundown = data.order.map((id) => data.rundown[id]);
      setFlatRunDown(flatRundown);
      setPrevRevision(data.revision);
    }
  }, [data.order, data.revision, data.rundown, prevRevision]);

  // TODO: should we have a project id field?
  // invalidate current version if project changes
  useEffect(() => {
    if (projectData?.title !== loadedProject.current) {
      setPrevRevision(-1);
      loadedProject.current = projectData?.title ?? '';
    }
  }, [projectData]);

  return { data: flatRunDown, status };
}

/**
 * Provides access to a partial rundown based on a filter callback
 */
export function usePartialRundown(cb: (event: OntimeRundownEntry) => boolean) {
  const { data, status } = useFlatRundown();
  const filteredData = useMemo(() => {
    return data.filter(cb);
  }, [data, cb]);

  return { data: filteredData, status };
}
