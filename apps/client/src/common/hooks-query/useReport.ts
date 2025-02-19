import { useQuery } from '@tanstack/react-query';
import { OntimeReport } from 'ontime-types';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { REPORT } from '../api/constants';
import { fetchReport } from '../api/report';

export default function useReport() {
  const { data, refetch } = useQuery<OntimeReport>({
    queryKey: REPORT,
    queryFn: fetchReport,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    networkMode: 'always',
    staleTime: MILLIS_PER_HOUR,
  });

  return { data: data ?? {}, refetch };
}
