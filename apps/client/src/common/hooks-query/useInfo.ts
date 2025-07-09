import { useQuery } from '@tanstack/react-query';
import { GetInfo } from 'ontime-types';
import { MILLIS_PER_MINUTE } from 'ontime-utils';

import { APP_INFO } from '../api/constants';
import { getInfo } from '../api/session';
import { ontimePlaceholderInfo } from '../models/Info';

export default function useInfo() {
  const { data, isLoading } = useQuery<GetInfo>({
    queryKey: APP_INFO,
    queryFn: getInfo,
    placeholderData: (previousData, _previousQuery) => previousData,
    staleTime: 10 * MILLIS_PER_MINUTE,
    initialData: ontimePlaceholderInfo,
  });

  return { data, isLoading };
}
