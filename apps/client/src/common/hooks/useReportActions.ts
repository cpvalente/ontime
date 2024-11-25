import { clearReport } from '../api/report';

export default function useReportAction() {
  return {
    clearReport: (id: string) => {
      clearReport(id);
    },
    clearAllReports: () => {
      clearReport();
    },
  };
}
