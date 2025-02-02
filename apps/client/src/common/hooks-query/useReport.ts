import { useQuery } from '@tanstack/react-query';
import { OntimeReport } from 'ontime-types';

import { REPORT } from '../api/constants';
import { fetchReport } from '../api/report';

export default function useReport() {
  const { data, status } = useQuery<OntimeReport>({
    queryKey: REPORT,
    queryFn: fetchReport,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    networkMode: 'always',
    enabled: false,
  });
  return { data: data ?? {}, status };
}
