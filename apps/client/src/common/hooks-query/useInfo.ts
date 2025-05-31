import { useQuery } from '@tanstack/react-query';
import { GetInfo, RefetchKey } from 'ontime-types';

import { getInfo } from '../api/session';
import { ontimePlaceholderInfo } from '../models/Info';

export default function useInfo() {
  const { data, status, isError, isFetching } = useQuery<GetInfo>({
    queryKey: [RefetchKey.APP_INFO],
    queryFn: getInfo,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    networkMode: 'always',
  });

  return { data: data ?? ontimePlaceholderInfo, status, isError, isFetching };
}
