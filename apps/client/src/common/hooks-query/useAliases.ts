import { useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { ALIASES } from '../api/apiConstants';
import { getAliases } from '../api/ontimeApi';

export default function useAliases() {
  const { data, status, isError, refetch } = useQuery({
    queryKey: ALIASES,
    queryFn: getAliases,
    placeholderData: [],
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return { data, status, isError, refetch };
}