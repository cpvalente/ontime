import { clearReport } from '../api/report';

export default function useReportAction() {
  return {
    clear: (id: string) => clearReport(id),
    clearAll: () => clearReport(), 
  };
}
