import { useQuery } from '@tanstack/react-query';

import { SERVER_LOG } from '../api/constants';
import { getLogEntries } from '../api/logs';

const pollInterval = 2000;

/**
 * Reads the newest entries of the server's session log while the log view is open
 */
export function useServerLog() {
  const { data } = useQuery({
    queryKey: SERVER_LOG,
    queryFn: ({ signal }) => getLogEntries(signal),
    refetchInterval: pollInterval,
  });

  return data ?? [];
}
