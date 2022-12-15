import { useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { EVENT_TABLE } from '../api/apiConstants';
import { fetchEvent } from '../api/eventApi';
import { eventDataPlaceholder } from '../models/EventData.type';

export default function useEvent() {
  const {
    data,
    status,
    isError,
    refetch,
  } = useQuery({
    queryKey: EVENT_TABLE,
    queryFn: fetchEvent,
    placeholderData: eventDataPlaceholder,
    retry: 5,
    retryDelay: attempt => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
  });

  return { data, status, isError, refetch };
}