import { useSuspenseQuery } from '@tanstack/react-query';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { getCSSContents } from '../api/assets';
import { CSS_OVERRIDE } from '../api/constants';

export default function useCssOverride() {
  const { data, status } = useSuspenseQuery({
    queryKey: CSS_OVERRIDE,
    queryFn: ({ signal }) => getCSSContents({ signal }),
    staleTime: MILLIS_PER_HOUR,
  });

  return { data, status };
}
