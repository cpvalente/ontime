import { useQuery } from '@tanstack/react-query';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { EVENT_DATA } from '../api/apiConstants';
import { fetchEventData } from '../api/eventDataApi';
import { eventDataPlaceholder } from '../models/EventData';

export default function useEventData() {
  const { data, status, isError, refetch } = useQuery({
    queryKey: EVENT_DATA,
    queryFn: fetchEventData,
    placeholderData: eventDataPlaceholder,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });

  return { data, status, isError, refetch };
}
