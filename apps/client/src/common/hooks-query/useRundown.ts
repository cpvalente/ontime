import { useQuery } from '@tanstack/react-query';

import { queryRefetchInterval } from '../../ontimeConfig';
import { RUNDOWN_TABLE } from '../api/apiConstants';
import { fetchRundown } from '../api/eventsApi';

export default function useRundown() {
  const { data, status, isError, refetch } = useQuery({
    queryKey: RUNDOWN_TABLE,
    queryFn: fetchRundown,
    placeholderData: [],
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchInterval,
    networkMode: 'always',
  });

  return { data, status, isError, refetch };
}
