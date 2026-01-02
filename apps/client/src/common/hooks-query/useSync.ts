import { useQuery } from '@tanstack/react-query';

import { getSyncList } from '../api/sync';

export function useSync() {
  const { data, status, isError, refetch, isLoading } = useQuery({
    queryKey: ['sync-client-list'],
    queryFn: getSyncList,
    placeholderData: (previousData, _previousQuery) => previousData,
  });

  return { list: data ?? [], status, isError, refetch, isLoading };
}
