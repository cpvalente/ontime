import { useQuery } from '@tanstack/react-query';
import { RefetchKey } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { getUrlPresets } from '../api/urlPresets';

export default function useUrlPresets() {
  const { data, status, isError, refetch } = useQuery({
    queryKey: [RefetchKey.URL_PRESETS],
    queryFn: getUrlPresets,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return { data: data ?? [], status, isError, refetch };
}
