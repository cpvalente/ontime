import { useQuery } from '@tanstack/react-query';
import { GetRundownCached, NormalisedRundown } from 'ontime-types';

import { queryRefetchInterval } from '../../ontimeConfig';
import { RUNDOWN } from '../api/apiConstants';
import { fetchCachedRundown } from '../api/eventsApi';

// revision is -1 so that the remote revision is higher
const cachedRundownPlaceholder = { order: [] as string[], rundown: {} as NormalisedRundown, revision: -1 };

export default function useRundown() {
  const { data, status, isError, refetch, isFetching } = useQuery<GetRundownCached>({
    queryKey: RUNDOWN,
    queryFn: fetchCachedRundown,
    placeholderData: cachedRundownPlaceholder,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchInterval,
    networkMode: 'always',
  });
  return { data: data ?? cachedRundownPlaceholder, status, isError, refetch, isFetching };
}
