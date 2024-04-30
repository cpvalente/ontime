import { useQuery } from '@tanstack/react-query';

import { queryRefetchInterval } from '../../ontimeConfig';
import { getClients } from '../api/clientRemote';
import { CLIENT_LIST } from '../api/constants';

export default function useClientRemote() {
  const { data, isError, refetch } = useQuery({
    queryKey: CLIENT_LIST,
    queryFn: getClients,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchInterval, //TODO: set back to slow
    networkMode: 'always',
  });

  return { data: data ?? [], isError, refetch };
}
