import { useQuery } from '@tanstack/react-query';
import { GetRundownCached } from 'ontime-types';

import { trpc } from '../../AppRouter';
import { queryRefetchInterval } from '../../ontimeConfig';
import { RUNDOWN } from '../api/apiConstants';

const cachedRundownPlaceholder = { rundown: [], revision: -1 };

// TODO: can we leverage structural sharing to see if data has changed?
export default function useRundown() {
  const { data, status, isError, refetch, isFetching } = useQuery<GetRundownCached>({
    queryKey: RUNDOWN,
    queryFn: async () => {
      return await trpc.rundownRouterr.getRundownCached.query();
    },
    placeholderData: cachedRundownPlaceholder,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchInterval,
    networkMode: 'always',
    // structuralSharing: (oldData: GetRundownCached | undefined, newData: GetRundownCached) => {
    //   if (oldData === undefined) {
    //     return cachedRundownPlaceholder;
    //   }
    //   const hasDataChanged = oldData?.revision === newData.revision;
    //   return hasDataChanged ? oldData : newData;
    // },
  });
  return { data: data?.rundown ?? [], status, isError, refetch, isFetching };
}
