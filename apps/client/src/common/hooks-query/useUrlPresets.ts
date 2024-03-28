import { useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { URL_PRESETS } from '../api/constants';
import { getUrlPresets } from '../api/urlPresets';

export default function useUrlPresets() {
  const { data, status, isError, refetch } = useQuery({
    queryKey: URL_PRESETS,
    queryFn: getUrlPresets,
    placeholderData: [],
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return { data: data ?? [], status, isError, refetch };
}
