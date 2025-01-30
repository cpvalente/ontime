import { useQuery } from '@tanstack/react-query';
import { OntimeReport } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { REPORT } from '../api/constants';
import { fetchReport } from '../api/report';

export default function useReport() {
  const { data, status } = useQuery<OntimeReport>({
    queryKey: REPORT,
    queryFn: fetchReport,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });
  return { data: data ?? {}, status };
}
