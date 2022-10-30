import { useQuery } from '@tanstack/react-query';

import { RUNDOWN_TABLE } from '../api/apiConstants';
import { fetchRundown } from '../api/eventsApi';

export default function useRundown() {
  const {
    data,
    status,
    isError,
    refetch,
  } = useQuery(RUNDOWN_TABLE, fetchRundown, { placeholderData: [] });

  return { data, status, isError, refetch };
}
