import { useQuery } from '@tanstack/react-query';
import { GetInfo } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { APP_INFO } from '../api/constants';
import { getInfo } from '../api/session';
import { ontimePlaceholderInfo } from '../models/Info';

export default function useInfo() {
  const { data, status, isError, refetch, isFetching } = useQuery<GetInfo>({
    queryKey: APP_INFO,
    queryFn: ({ signal }) => getInfo({ signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchInterval: queryRefetchIntervalSlow,
  });

  return { data: data ?? ontimePlaceholderInfo, status, isError, refetch, isFetching };
}
