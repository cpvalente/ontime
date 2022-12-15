import { useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { APP_INFO } from '../api/apiConstants';
import { getInfo } from '../api/ontimeApi';
import { ontimePlaceholderInfo } from '../models/Info.types';

export default function useInfo() {
  const {
    data,
    status,
    isError,
    refetch,
  } = useQuery({
    queryKey: APP_INFO,
    queryFn: getInfo,
    placeholderData: ontimePlaceholderInfo,
    retry: 5,
    retryDelay: attempt => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
  });

  return { data, status, isError, refetch };
}
