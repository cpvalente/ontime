import { useQuery } from '@tanstack/react-query';
import type { ReportData } from 'ontime-types';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { REPORT } from '../api/constants';
import { fetchReport } from '../api/report';

const emptyReport: ReportData = {
  eventReports: {},
  rundown: null,
  show: {
    plannedStart: null,
    plannedEnd: null,
    plannedDuration: null,
    actualStart: null,
    actualEnd: null,
    actualDuration: null,
  },
};

export default function useReport() {
  const { data: report, refetch } = useQuery<ReportData>({
    queryKey: REPORT,
    queryFn: ({ signal }) => fetchReport({ signal }),
    placeholderData: (previousData) => previousData,
    staleTime: MILLIS_PER_HOUR,
  });

  return {
    data: report?.eventReports ?? emptyReport.eventReports,
    report: report ?? emptyReport,
    refetch,
  };
}
