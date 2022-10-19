import { useQuery } from '@tanstack/react-query';

import { EVENTS_TABLE } from '../api/apiConstants';
import { fetchAllEvents } from '../api/eventsApi';

export default function useEventsList() {
  const {
    data,
    status,
    isError,
    refetch,
  } = useQuery(EVENTS_TABLE, fetchAllEvents, { placeholderData: [] });

  return { data, status, isError, refetch };
}
