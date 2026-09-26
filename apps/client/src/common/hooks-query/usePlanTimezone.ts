import { useQuery } from '@tanstack/react-query';
import type { PlanTimezone } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { SESSION_STATS } from '../api/constants';
import { getSessionStats } from '../api/session';

/**
 * Timezone the rundown is planned in, undefined until resolved by the server
 */
export default function usePlanTimezone(): PlanTimezone | undefined {
  const { data } = useQuery({
    queryKey: SESSION_STATS,
    queryFn: ({ signal }) => getSessionStats({ signal }),
    select: (stats) => stats.planTimezone,
    placeholderData: (previousData, _previousQuery) => previousData,
    // the offset only changes with DST, the refetch keeps long running views current
    refetchInterval: queryRefetchIntervalSlow,
  });

  return data;
}
