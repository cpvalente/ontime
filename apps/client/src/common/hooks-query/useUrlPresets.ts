import { useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { URL_PRESETS } from '../api/constants';
import { getUrlPresets } from '../api/urlPresets';

interface FetchProps {
  skip?: boolean;
}

export default function useUrlPresets({ skip = false }: FetchProps = {}) {
  const { data, status, isError, refetch } = useQuery({
    queryKey: URL_PRESETS,
    queryFn: getUrlPresets,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
    enabled: !skip,
  });

  return { data: data ?? [], status, isError, refetch };
}
