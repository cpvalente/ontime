import { useQuery } from '@tanstack/react-query';
import { langEn } from 'ontime-types';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { getUserTranslation } from '../../common/api/assets';
import { TRANSLATION } from '../../common/api/constants';

export function useCustomTranslation() {
  const { data, status, refetch } = useQuery({
    queryKey: TRANSLATION,
    queryFn: ({ signal }) => getUserTranslation({ signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    staleTime: MILLIS_PER_HOUR,
  });
  return { data: data ?? langEn, status, refetch };
}
