import { useQuery } from '@tanstack/react-query';
import { GetRundownCached } from 'ontime-types';

import { queryRefetchInterval } from '../../ontimeConfig';
import { RUNDOWN } from '../api/apiConstants';
import { fetchCachedRundown } from '../api/eventsApi';

const cachedRundownPlaceholder = { rundown: [], revision: -1 };

// TODO: can we leverage structural sharing to see if data has changed?
export default function useRundown() {
  return useQuery<GetRundownCached>({
    queryKey: RUNDOWN,
    queryFn: fetchCachedRundown,
    placeholderData: cachedRundownPlaceholder,
    retry: 5,
    select: (data) => data.rundown,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchInterval,
    networkMode: 'always',
    // structuralSharing: (oldData: GetRundownCached | undefined, newData: GetRundownCached) => {
    //   if (oldData === undefined) {
    //     cachedRundownPlaceholder;
    //   }
    //   const hasDataChanged = oldData?.revision === newData.revision;
    //   return hasDataChanged ? oldData : newData;
    // },
  });
}
