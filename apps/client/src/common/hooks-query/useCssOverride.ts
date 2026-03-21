import { useQuery } from '@tanstack/react-query';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { getCSSContents } from '../api/assets';
import { CSS_OVERRIDE } from '../api/constants';

export default function useCssOverride(enabled: boolean) {
  const { data, status } = useQuery({
    queryKey: CSS_OVERRIDE,
    queryFn: ({ signal }) => getCSSContents({ signal }),
    staleTime: MILLIS_PER_HOUR,
    enabled,
  });

  return {
    data: data ?? '',
    status,
  };
}
