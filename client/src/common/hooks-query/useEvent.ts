import { useQuery } from '@tanstack/react-query';

import { EVENT_TABLE } from '../api/apiConstants';
import { fetchEvent } from '../api/eventApi';
import { eventDataPlaceholder } from '../models/EventData.type';

export default function useEvent() {
  const {
    data,
    status,
    isError,
    refetch,
  } = useQuery(EVENT_TABLE, fetchEvent, { placeholderData: eventDataPlaceholder });

  return { data, status, isError, refetch };
}