import { useQuery } from '@tanstack/react-query';
import { GetInfo } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { APP_INFO } from '../api/apiConstants';
import { getInfo } from '../api/ontimeApi';
import { ontimePlaceholderInfo } from '../models/Info';

export default function useInfo() {
  const { data, status, isError, refetch, isFetching } = useQuery<GetInfo>({
    queryKey: APP_INFO,
    queryFn: getInfo,
    placeholderData: ontimePlaceholderInfo,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return { data, status, isError, refetch, isFetching };
}
