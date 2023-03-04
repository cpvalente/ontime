import { useQuery } from '@tanstack/react-query';

import { queryRefetchInterval } from '../../ontimeConfig';
import { REMOTE_VERSION } from '../api/apiConstants';
import { getRemoteVersion } from '../api/ontimeApi';
import { placeholderRemoteVersion } from '../models/RemoteVersion';

export default function useRemoteVersion() {
  const { data, status, isError, refetch } = useQuery({
    queryKey: REMOTE_VERSION,
    queryFn: getRemoteVersion,
    placeholderData: placeholderRemoteVersion,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchInterval,
    networkMode: 'always',
  });

  return { data, status, isError, refetch };
}
