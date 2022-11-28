import { useQuery } from '@tanstack/react-query';

import { ALIASES } from '../api/apiConstants';
import { getAliases } from '../api/ontimeApi';

export default function useAliases() {
  const {
    data,
    status,
    isError,
    refetch,
  } = useQuery(ALIASES, getAliases, { placeholderData: [], retry: 5, retryDelay: attempt => attempt * 2500 });

  return { data, status, isError, refetch };
}