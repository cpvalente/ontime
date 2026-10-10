import { useQuery } from '@tanstack/react-query';
import type { TeleprompterScript } from 'ontime-types';

import { TELEPROMPTER_SCRIPT } from '../api/constants';
import { getTeleprompterScript } from '../api/teleprompter';

/** The teleprompter script every view reads, refetched when the server says it changed */
export default function useTeleprompterScript() {
  const { data, status } = useQuery<TeleprompterScript>({
    queryKey: TELEPROMPTER_SCRIPT,
    queryFn: ({ signal }) => getTeleprompterScript({ signal }),
    placeholderData: (previousData) => previousData,
    staleTime: Infinity,
  });

  return { data, status };
}
