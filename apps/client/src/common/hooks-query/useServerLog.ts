import { useQuery } from '@tanstack/react-query';

import { SERVER_LOG } from '../api/constants';
import { getLogEntries } from '../api/logs';

/** the log view tells users how often it refreshes */
export const serverLogPollInterval = 2000;

/**
 * Reads the newest entries of the server's session log while the log view is open
 */
export function useServerLog() {
  const { data, isPending } = useQuery({
    queryKey: SERVER_LOG,
    queryFn: ({ signal }) => getLogEntries(signal),
    refetchInterval: serverLogPollInterval,
  });

  return { serverLogs: data ?? [], isPending };
}
