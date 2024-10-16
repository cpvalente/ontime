import { useQuery } from '@tanstack/react-query';
import { OntimeReport } from 'ontime-types';

import { queryRefetchIntervalSlow } from '../../ontimeConfig';
import { REPORT } from '../api/constants';
import { fetchReport } from '../api/report';

// revision is -1 so that the remote revision is higher
const reportPlaceholder: OntimeReport = {};

export default function useReport() {
  const { data, status, isError, refetch, isFetching } = useQuery<OntimeReport>({
    queryKey: REPORT,
    queryFn: fetchReport,
    placeholderData: (previousData, _previousQuery) => previousData,
    retry: 5,
    retryDelay: (attempt) => attempt * 2500,
    refetchInterval: queryRefetchIntervalSlow,
    networkMode: 'always',
  });
  return { data: data ?? reportPlaceholder, status, isError, refetch, isFetching };
}
