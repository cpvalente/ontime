import { useQuery } from '@tanstack/react-query';
import { SessionStats } from 'ontime-types';

import { queryRefetchInterval } from '../../ontimeConfig';
import { SESSION_STATS } from '../api/constants';
import { getSessionStats } from '../api/session';
import { ontimePlaceholderSessionStats } from '../models/Info';

export default function useSessionStats() {
  const { data, status, isError, refetch, isFetching } = useQuery<SessionStats>({
    queryKey: SESSION_STATS,
    queryFn: ({ signal }) => getSessionStats({ signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchInterval: queryRefetchInterval,
  });

  return { data: data ?? ontimePlaceholderSessionStats, status, isError, refetch, isFetching };
}
