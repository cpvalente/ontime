import { useQuery } from '@tanstack/react-query';
import { GetRundownCached, OntimeRundown } from 'ontime-types';

import { queryRefetchInterval } from '../../ontimeConfig';
import { RUNDOWN_TABLE } from '../api/apiConstants';
import { fetchCachedRundown } from '../api/eventsApi';

const cachedRundownPlaceholder = { rundown: [], revision: -1 };

export default function useRundown() {
  const { data, status, isError, refetch } = useQuery<GetRundownCached>({
    queryKey: RUNDOWN_TABLE,
    queryFn: fetchCachedRundown,
    placeholderData: cachedRundownPlaceholder,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchInterval,
    networkMode: 'always',
    structuralSharing: (oldData: GetRundownCached | undefined, newData: GetRundownCached) => {
      if (oldData === undefined) {
        cachedRundownPlaceholder;
      }
      const hasDataChanged = oldData?.revision === newData.revision;
      return hasDataChanged ? oldData : newData;
    },
  });

  const rundown: OntimeRundown = data?.rundown ?? [];

  return { data: rundown, status, isError, refetch };
}

/**


 + structuralSharing: (oldData, newData) => customCheck(oldData, newData) ? oldData : replaceEqualDeep(oldData, newData)

 */
