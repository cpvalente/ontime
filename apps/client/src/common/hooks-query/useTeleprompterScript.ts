import { useQuery } from '@tanstack/react-query';
import type { TeleprompterScript } from 'ontime-types';

import { TELEPROMPTER_SCRIPT } from '../api/constants';
import { getTeleprompterScript } from '../api/teleprompter';

export default function useTeleprompterScript(source?: string) {
  const { data, status } = useQuery<TeleprompterScript>({
    queryKey: [...TELEPROMPTER_SCRIPT, source ?? null],
    queryFn: ({ signal }) => getTeleprompterScript(source, { signal }),
    placeholderData: (previousData) => previousData,
    staleTime: Infinity,
  });

  return { data, status };
}
