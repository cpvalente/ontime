import { useQuery } from '@tanstack/react-query';
import { ShowRun, ShowRunSummary } from 'ontime-types';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { getLatestRunQueryKey, REPORT_RUNS } from '../api/constants';
import { fetchLatestRun, fetchRun, fetchRuns } from '../api/report';

/**
 * Run history for the current project, optionally scoped to a rundown
 */
export default function useRuns(rundownId?: string) {
  const { data, status, refetch } = useQuery<ShowRunSummary[]>({
    queryKey: rundownId ? [...REPORT_RUNS, rundownId] : REPORT_RUNS,
    queryFn: ({ signal }) => fetchRuns(rundownId, { signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    staleTime: MILLIS_PER_HOUR,
  });

  return { data: data ?? [], status, refetch };
}

/**
 * A single run with its per event data, fetched on demand when a run is selected
 */
export function useRun(id: string | null) {
  const { data, status } = useQuery<ShowRun>({
    queryKey: [...REPORT_RUNS, id],
    queryFn: ({ signal }) => fetchRun(id as string, { signal }),
    enabled: id !== null,
    staleTime: MILLIS_PER_HOUR,
  });

  return { data, status };
}

/**
 * Most recently closed run, used to compare a rundown against its last outing.
 * Returns null while there is no run to compare against.
 */
export function useLatestRun(rundownId?: string) {
  const { data, status } = useQuery<ShowRun | null>({
    queryKey: getLatestRunQueryKey(rundownId),
    queryFn: ({ signal }) => fetchLatestRun(rundownId, { signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    staleTime: MILLIS_PER_HOUR,
  });

  return { data: data ?? null, status };
}
