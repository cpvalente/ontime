import { useQuery } from '@tanstack/react-query';
import { langEn } from 'ontime-types';

import { getUserTranslation } from '../../common/api/assets';
import { TRANSLATION } from '../../common/api/constants';
import { queryRefetchIntervalSlow } from '../../ontimeConfig';

export function useCustomTranslation() {
  const { data, status, refetch } = useQuery({
    queryKey: TRANSLATION,
    queryFn: ({ signal }) => getUserTranslation({ signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchInterval: queryRefetchIntervalSlow,
  });
  return { data: data ?? langEn, status, refetch };
}
