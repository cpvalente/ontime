import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NormalisedRundown, OntimeRundown, OntimeRundownEntry, RundownCached } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { RUNDOWN } from '../api/constants';
import { fetchNormalisedRundown } from '../api/rundown';
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
  const flatRunDown = useMemo<OntimeRundown>(() => data.order.map((id) => data.rundown[id]), [data.order, data.rundown]);

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
