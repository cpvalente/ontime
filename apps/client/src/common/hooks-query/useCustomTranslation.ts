import { useQuery } from '@tanstack/react-query';

import { getUserTranslation } from '../../common/api/assets';
import { TRANSLATION } from '../../common/api/constants';
import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { langEn } from '../../translation/languages/en';

export function useCustomTranslation() {
  const { data, status, refetch } = useQuery({
    queryKey: TRANSLATION,
    queryFn: getUserTranslation,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt: number) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });
  return { data: data ?? langEn, status, refetch };
}
