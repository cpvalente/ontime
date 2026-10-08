import { useQuery } from '@tanstack/react-query';
import type { TeleprompterScript } from 'ontime-types';

import { TELEPROMPTER_SCRIPT } from '../api/constants';
import { getTeleprompterScript } from '../api/teleprompter';

/**
 * The teleprompter script, refetched when the server says it changed
 * @param search - a local view's own settings, or empty for the shared script
 */
export default function useTeleprompterScript(search = '') {
  const { data, status } = useQuery<TeleprompterScript>({
    queryKey: [...TELEPROMPTER_SCRIPT, search],
    queryFn: ({ signal }) => getTeleprompterScript(search, { signal }),
    placeholderData: (previousData) => previousData,
    staleTime: Infinity,
  });

  return { data, status };
}
