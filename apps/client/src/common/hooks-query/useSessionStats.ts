import { useQuery } from '@tanstack/react-query';
import { SessionStats } from 'ontime-types';

import { queryRefetchInterval } from '../../ontimeConfig';
import { SESSION_STATS } from '../api/constants';
import { getSessionStats } from '../api/session';

export default function useSessionStats() {
  const { data, status, isError, refetch } = useQuery<SessionStats>({
    queryKey: SESSION_STATS,
    queryFn: ({ signal }) => getSessionStats({ signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchInterval: queryRefetchInterval,
  });

  return { data, status, isError, refetch };
}
