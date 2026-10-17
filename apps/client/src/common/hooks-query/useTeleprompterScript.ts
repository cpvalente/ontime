import { useQuery } from '@tanstack/react-query';
import type { TeleprompterScript } from 'ontime-types';

import { TELEPROMPTER_SCRIPT } from '../api/constants';
import { getTeleprompterScript } from '../api/teleprompter';

/**
 * The teleprompter script a view reads, refetched when the server says it changed
 * @param source - the field to read instead of the project's, for a view which plays on its own
 */
export default function useTeleprompterScript(source?: string) {
  const { data, status } = useQuery<TeleprompterScript>({
    queryKey: [...TELEPROMPTER_SCRIPT, source ?? null],
    queryFn: ({ signal }) => getTeleprompterScript(source, { signal }),
    placeholderData: (previousData) => previousData,
    staleTime: Infinity,
  });

  return { data, status };
}
